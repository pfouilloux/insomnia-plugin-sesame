const tempy = require('tempy')
const etl = require('etl')
const mime = require('mime-types')
const child = require('child_process');

const CONTENT_TYPE_BLACKLIST = ["text/", "application/json"]

module.exports.templateTags = [{
    name: 'open_sesame',
    displayName: 'Open',
    description: 'Saves response body to a temp file and opens it using system defaults',
    args: [
        {
            displayName: 'Request',
            type: 'model',
            model: 'Request',
        },
    ]
}]

module.exports.responseHooks = [
    context => {
        const contentType = context.response.getHeader('Content-Type')
        if (context.response.getStatusCode() !== 200 || CONTENT_TYPE_BLACKLIST.some((it) => contentType.startsWith(it))) {
            return
        }

        const extension = mime.extension(contentType)
        if (!extension) {
            throw new Error(`Invalid content type ${extension}`)
        }

        const tempFile = tempy.file({extension: extension})
        context.response.getBodyStream()
            .pipe(etl.toFile(tempFile))
            .promise()
            .then(() => child.exec(getCommandLine() + ' ' + tempFile))
    }
]

function getCommandLine() {
    switch (process.platform) {
        case 'darwin' :
            return 'open';
        case 'win32' :
            return 'start';
        case 'win64' :
            return 'start';
        default :
            return 'xdg-open';
    }
}
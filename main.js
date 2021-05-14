const tempy = require('tempy')
const etl = require('etl')
const mime = require('mime-types')
const child = require('child_process');

const MAGIC_HEADER_KEY = "OPEN_SESAME"
const MAGIC_HEADER_VAL = "SUPERCALIFRAGILISTICEXPIALIDOCIOUS_42"

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
    ],
    async run(context, requestId) {
        const request = await context.util.models.request.getById(requestId)
        request.headers.push({name: MAGIC_HEADER_KEY, value: MAGIC_HEADER_VAL})
    }
}]

module.exports.responseHooks = [
    context => {
        if (!context.request.getHeader(MAGIC_HEADER_KEY) === MAGIC_HEADER_VAL || context.response.getStatusCode() !== 200) {
            return
        }

        const contentType = context.response.getHeader('Content-Type')
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
'use strict';

var componentWriter = require('./component-writer.js');

class PostProcessorsFactory {
    createAll() {
        return [
            new componentWriter.ComponentsWriter()
        ];
    }
}

exports.PostProcessorsFactory = PostProcessorsFactory;
//# sourceMappingURL=factory.js.map

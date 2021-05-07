class FileInfo {
    constructor(fileName, { isFilePath = false } = {}) {
        this.filepath = '';
        this.filename = '';
        this.operID = '';
        this.date = null;
        this.time = null;
        this.UTCdatetime = null;
        this.type = null;
        this.version = null;
        this.extension = '';
        this.hash = Buffer.alloc(128, 0x00, 'hex');
        this.message = '';
        this.valid = false;
        if (fileName) {
            return this.set(fileName, { isFilePath });
        }
    };
    set = function (fileName, { isFilePath }) {
        if (isFilePath && isFilePath === true) {
            this.filepath = fileName;
            var temp = this.filepath.split(/(\\|\/)/gi); //this is required in order to return 
            if (Array.isArray(temp)) {                  //a valid filename string to the user 
                this.filename = temp[temp.length - 1]; //if there is an error below
            } else {
                this.filename = this.filepath;
                this.operID = this.filename.substring([0]);
            }
        }
        this.basename = this.filename.substring(0, this.filename.length - 4);
        this.attributes = this.basename.split('_');
        this.operID = this.attributes[0];
        if (this.fileNameValid() >= 0) {
            this.date = this.attributes[1] + '-' + this.attributes[2] + '-' + this.attributes[3];
            this.time = this.attributes[4] + ":" + this.attributes[5] + ":" + this.attributes[6];
            this.UTCdatetime = new Date(this.date + "T" + this.time + "Z");
            this.type = this.attributes[7];
            this.version = parseInt(this.attributes[8].replace(/\D/g, ''));
            this.extension = this.filename.substring(this.filename.length - 3, this.filename.length);
            this.valid = true;
        }
    }

    fileNameValid = function () {
        const match = this.filepath.search(new RegExp(process.env.REPORT_FILENAME_REGEX, 'gi')); 
        return (match);
    }
};

module.exports = FileInfo;

//configuration for multer
//middleware for images 
const multer = require('multer');

//convert frontend's mime_types for file extension
const MIME_TYPES = {
    'image/jpg':'jpg',
    'image/jpeg':'jpg',
    'image/png':'png'
};

//save on disk ("null" means no error)
//Date.now() is to guaranty uniqueness of file's name
const storage = multer.diskStorage({
    destination:(req,file,callback) => {
        callback(null,'images')
    },
    filename: (req,file,callback) => {
        const name = file.originalname.split(' ').join('_');
        const extension = MIME_TYPES[file.mimetype];
        callback(null, Date.now() + '.' + extension)
    }
});

module.exports =multer({storage}).single('image');
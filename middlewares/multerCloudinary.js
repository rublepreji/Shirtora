import multer from 'multer';
import  pkg  from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';
const {CloudinaryStorage}=pkg

const uploadto = (foldername) => {
    const storage = new CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
            folder: `shirtora/${foldername}`,
            allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
            transformation: [{ width: 1200, crop: 'limit' }]
        },
    });
    return multer({ storage });
};

export default uploadto;

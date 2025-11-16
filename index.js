// 1. IMPORTAR LOS "COMPAS"
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

// 2. CONFIGURACIONES INICIALES
const app = express();
app.use(express.json());
app.use(cors());

// --- Configurar Cloudinary ---
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

// --- Configurar Multer ---
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// 3. CONECTAR A MONGO ATLAS
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('¡Conectado a Mongo Atlas! 😎'))
    .catch((err) => console.error('Error de conexión a Mongo:', err));

// 4. EL "MOLDE" (ESQUEMA)
const productoSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    descripcion: String,
    stock: { type: Number, default: 0 },
    category: { type: String, required: true, default: 'General' },
    imageUrl: { type: String, required: true },
    public_id: { type: String, required: true } // ID de Cloudinary para borrar
});

const Producto = mongoose.model('Producto', productoSchema);

// 5. LAS "RECETAS" (RUTAS)

// --- READ (Leer todos los productos) ---
app.get('/productos', async (req, res) => {
    try {
        const productos = await Producto.find();
        res.json(productos);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al buscar productos' });
    }
});

// --- CREATE (Crear un producto CON IMAGEN) ---
app.post('/productos', upload.single('imagen'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ mensaje: '¡Error! No se subió ningún archivo.' });
    }
    try {
        const cloudinaryResponse = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                { folder: 'almacen-productos' },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result);
                }
            );
            uploadStream.end(req.file.buffer);
        });

        const nuevoProducto = new Producto({
            nombre: req.body.nombre,
            descripcion: req.body.descripcion,
            stock: req.body.stock,
            category: req.body.category,
            imageUrl: cloudinaryResponse.secure_url,
            public_id: cloudinaryResponse.public_id
        });

        await nuevoProducto.save();
        res.status(201).json(nuevoProducto);

    } catch (error) {
        console.error('Error al crear producto:', error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
});

// --- DELETE (Borrar un producto) ---
app.delete('/productos/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const producto = await Producto.findById(id);
        if (!producto) {
            return res.status(404).json({ mensaje: 'Producto no encontrado' });
        }
        await cloudinary.uploader.destroy(producto.public_id);
        await Producto.findByIdAndDelete(id);
        res.json({ mensaje: 'Producto y su imagen borrados exitosamente' });
    } catch (error) {
        console.error('Error al borrar producto:', error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
});

// --- UPDATE (Editar un producto) ---
app.put('/productos/:id', upload.single('imagen'), async (req, res) => {
    try {
        const id = req.params.id;
        const producto = await Producto.findById(id);
        if (!producto) {
            return res.status(404).json({ mensaje: 'Producto no encontrado' });
        }

        const datosActualizados = {
            nombre: req.body.nombre || producto.nombre,
            descripcion: req.body.descripcion || producto.descripcion,
            stock: req.body.stock || producto.stock,
            category: req.body.category || producto.category
        };

        if (req.file) {
            console.log("¡Reemplazando imagen!");
            await cloudinary.uploader.destroy(producto.public_id);
            const cloudinaryResponse = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    { folder: 'almacen-productos' },
                    (error, result) => {
                        if (error) return reject(error);
                        resolve(result);
                    }
                );
                uploadStream.end(req.file.buffer);
            });
            datosActualizados.imageUrl = cloudinaryResponse.secure_url;
            datosActualizados.public_id = cloudinaryResponse.public_id;
        }

        const productoActualizado = await Producto.findByIdAndUpdate(id, datosActualizados, { new: true });
        res.json(productoActualizado);
    } catch (error) {
        console.error('Error al actualizar producto:', error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
});

// 6. ARRANCAR EL SERVIDOR
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`¡API de Almacén v2.0 corriendo en http://localhost:${PORT}! 🚀`);
});
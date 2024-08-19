const express = require('express');
const router = express.Router();
const User = require('../models/users');
const multer = require('multer');
const fs = require('fs');

// Image upload configuration
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, './uploads');
    },
    filename: function(req, file, cb) {
        cb(null, file.fieldname + '_' + file.originalname);
    },
});

const upload = multer({
    storage: storage,
}).single('image');

// Insert user data into Database
router.post('/add', upload, (req, res) => {
    const newUser = new User({
        roll: req.body.roll,
        name: req.body.name,
        phone: req.body.phone,
        email: req.body.email,
        image: req.file.filename,
    });

    newUser.save()
        .then(() => {
            req.session.message = {
                type: 'success',
                message: 'User added successfully!',
            };
            res.redirect('/');
        })
        .catch((err) => {
            res.json({ message: err.message, type: 'danger' });
        });
});

// Get all users
router.get('/', async (req, res) => {
    try {
        const users = await User.find().exec();
        res.render('index', {
            title: 'Home Page',
            users: users,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});




// Render add user page
router.get('/add', (req, res) => {
    res.render('add_users', { title: 'Add Users' });
});

// Render edit user page
router.get('/edit/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const user = await User.findById(id).exec();
        if (!user) {
            return res.redirect('/');
        }

        res.render('edit_users', {
            title: 'Edit User',
            user: user,
        });
    } catch (err) {
        console.error(err); // Log the error for debugging
        res.redirect('/');
    }
});

// Update user route
router.post('/update/:id', upload, (req, res) => {
    const id = req.params.id;
    let new_image = '';

    if (req.file) {
        new_image = req.file.filename;

        if (req.body.old_image) {
            fs.unlink(`./uploads/${req.body.old_image}`, (err) => {
                if (err) {
                    console.error('Error deleting old image:', err);
                }
            });
        }
    } else {
        new_image = req.body.old_image;
    }

    User.findByIdAndUpdate(id, {
        roll: req.body.roll,
        name: req.body.name,
        phone: req.body.phone,
        email: req.body.email,
        image: new_image,
    })
    .then(() => {
        req.session.message = {
            type: 'success',
            message: 'User updated successfully!',
        };

        // Redirect to the previous page or default to home
        res.redirect('/');
    })
    .catch((err) => {
        res.json({ message: err.message, type: 'danger' });
    });
});

//Delete User Route
router.get('/delete/:id', (req, res) => {
    const id = req.params.id;

    User.findByIdAndDelete(id)
        .then(result => {
            if (result && result.image) {
                fs.unlink(`./uploads/${result.image}`, (err) => {
                    if (err) {
                        console.error('Error deleting image:', err);
                    }
                });
            }

            req.session.message = {
                type: 'info',
                message: 'User deleted successfully!',
            };
            res.redirect('/');
        })
        .catch(err => {
            res.json({ message: err.message });
        });
});
module.exports = router;

var express = require('express');
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken')

var SEED = require('../config/config').SEED

var app = express();

var Usuario = require('../models/usuario')

const GOOGLE_CLIENT_ID = require('../config/config').GOOGLE_CLIENT_ID;
const GOOGLE_SECRET = require('../config/config').GOOGLE_SECRET;

const { OAuth2Client } = require('google-auth-library');


//==================================================================
// Autenticacion Google
//==================================================================

app.post('/google', (req, res) => {

    var token = req.body.token || 'XXXXX';

    const oAuth2Client = new OAuth2Client(
        GOOGLE_CLIENT_ID,
        GOOGLE_SECRET
    );

    const tiket = oAuth2Client.verifyIdToken({
        idToken: token,
        audience: GOOGLE_CLIENT_ID
    });

    tiket.then(payload => {

        Usuario.findOne({ email: payload.payload.email }, (err, usuario) => {

            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error al buscar usuario - login',
                    errors: err
                })
            }

            if (usuario) {

                if (!usuario.google) {
                    return res.status(400).json({
                        ok: true,
                        mensaje: 'Debe de usar su autenticacion normal'
                    });
                } else {

                    usuario.password = ':)';

                    var token = jwt.sign({ usuario: usuario }, SEED, { expiresIn: 14400 });

                    res.status(200).json({
                        ok: true,
                        usuario: usuario,
                        token: token,
                        id: usuario._id
                    });

                }
            } else {
                //Si el usuario no existe por correo

                var usuario = new Usuario();

                usuario.nombre = payload.payload.name;
                usuario.email = payload.payload.email;
                usuario.password = ':)';
                usuario.img = payload.payload.picture;
                usuario.google = true;

                usuario.save((err, usuarioDB) => {
                    if (err) {
                        return res.status(500).json({
                            ok: false,
                            mensaje: 'Error al guardar usuario',
                            errors: err,
                        });
                    }
                    var token = jwt.sign({ usuario: usuarioDB }, SEED, { expiresIn: 14400 });

                    res.status(200).json({
                        ok: true,
                        usuario: usuarioDB,
                        token: token,
                        id: usuarioDB._id
                    });
                })
            }
        });
    });
});



//==================================================================
// Autenticacion normal
//==================================================================

app.post('/', (req, res) => {

    var body = req.body;

    Usuario.findOne({ email: body.email }, (err, usuarioDB) => {

        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar usuario',
                errors: err
            });
        }

        if (!usuarioDB) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Credenciales incorrectas - email',
                errors: err
            });
        }

        if (!bcrypt.compareSync(body.password, usuarioDB.password)) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Credenciales incorrectas - password',
                errors: err
            });
        }

        //Crear un token

        usuarioDB.password = ':)';
        var token = jwt.sign({ usuario: usuarioDB }, SEED, { expiresIn: 14400 });


        res.status(200).json({
            ok: true,
            usuario: usuarioDB,
            token: token,
            id: usuarioDB._id
        });
    })

});


module.exports = app;
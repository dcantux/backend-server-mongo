var express = require('express');

var app = express();

var fs = require('fs')

//rutas
app.get('/:tipo/:img', (req, res, next) => {

    var tipo = req.params.tipo;
    var img = req.params.img;

    var path = `./uploads/${ tipo }/${ img }`;

    fs.exists(path, existe => {

        if (!existe) {

            res.sendFile('no-img.jpg', { root: './assets/' })
            return;
            //            path = './assets/no-img.jpg'
        }

        //        res.sendfile(path);
        res.sendFile(img, { root: './uploads/' + tipo })
    });
});

module.exports = app;
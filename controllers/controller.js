// Required dependencies
var express = require("express");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var request = require('request');
var cheerio = require("cheerio");
const db = require("../models");

module.exports = app => {
  // Routes
  app.get('/', (req, res) => {
    db.Article.find({})
      .then(function (data) {
        if (data) {
          let dbData = {
            article: data
          };
          res.render('index', dbData);
        } else {
          res.render('index');
        }
      })
      .catch(function (err) {
        res.json(err)
      });
  })
  // A GET route for scraping the Houston Chronicle website
  app.get("/scrape", function (req, res) {
    // First, we grab the body of the html with request
    request('https://www.houstonchronicle.com/', function (err, response, body) {
      // Then, we load that into cheerio and save it to $ for a shorthand selector
      var $ = cheerio.load(body);

      $('h2.headline').each(function (err, element) {

        var title = $(element).text();
        var paragraph = $(element).parent().find($('p.blurb')).text();
        var link = $(element).children('a').attr('href');

        var scrappedObj = {
          link: link,
          title: title,
          paragraph: paragraph
        };

        db.Article.create(scrappedObj)
          .then(function (data) {
            // console.log(data);
          })
          .catch(function (err) {
            return res.json(err);
          })
      });
      // If we were able to successfully scrape and save an Article, send a message to the client
      res.send('Scrape Completed!');
    });
  });


  // Route for getting all Articles from the db
  app.get("/articles", function (req, res) {
    db.Article.find({})
      .then(function (data) {
        let dbData = {
          article: data
        };
        res.render('index', dbData);
      })
      .catch(function (err) {
        res.json(err)
      });
  });

  // Route for getting all saved Articles from the db and sending it to view
  app.get("/savedarticles", function (req, res) {
    db.Article.find({
        saved: true
      })
      .then(function (data) {
        let dbData = {
          article: data
        };
        res.render('saved', dbData);
      })
      .catch(function (err) {
        res.json(err)
      });
  });

  // Route for saving new article
  app.post("/savedarticles/:id", function (req, res) {
    console.log(req.params.id);
    db.Article.findOneAndUpdate({
        _id: req.params.id
      }, {
        $set: {
          saved: true
        }
      })
      .then(function (data) {
        res.send('article was saved in the DB');
      })
      .catch(function (err) {
        res.json(err)
      });
  });

  // Route for deleting
  app.post("/delete/:id", function (req, res) {
    console.log(req.params.id);
    db.Article.findOneAndUpdate({
        _id: req.params.id
      }, {
        $set: {
          saved: false
        }
      })
      .then(function (data) {
        res.send('article was deleted from saved');
      })
      .catch(function (err) {
        res.json(err)
      });
  });

  // Route for grabbing a specific Article by id, populate it with it's note
  app.get("/articles/:id", function (req, res) {
    db.Article.findById(req.params.id)
      .populate('note')
      .then(function (data) {
        res.json(data);
      })
      .catch(function (err) {
        res.json(err);
      })
  });

  // Route for saving/updating an Article's associated Note
  app.post("/articles/:id", function (req, res) {

    db.Note.create(req.body)
      .then(function (data) {
        return db.Article.findOneAndUpdate({
          _id: req.params.id
        }, {
          $push: {
            note: data.id
          }
        }, {
          new: true
        });
      })
      .then(function (dbArticle) {
        res.json(dbArticle);
      })
      .catch(function (err) {
        res.json(err);
      })
  });

  // Delete note route
  app.post('/deletenote/:id', function (req, res) {
    db.Note.remove({
        _id: req.params.id
      })
      .then(function (data) {
        console.log('note was deleted from the server');
        res.send('note was deleted from the server');
      })
  })
};




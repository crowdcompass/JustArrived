Attendees = new Meteor.Collection("attendees");

EMAIL_REGEX = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

// Github account usernames of admin users
var ADMIN_USERS = ['dshanley', 'Sproutworx'];
function isAdmin(userId) {
  var user = Meteor.users.findOne({_id: userId});
  try {
    return ADMIN_USERS.indexOf(user.services.github.username) !== -1;
  } catch(e) {
    return false;
 }
}

// Routes
// Router.map(function () {
//   this.route('main', {
//     path: '/'
//   });

//   this.route('wall', {
//     controller: 'WallController',
//   });
// });

/////////// Client

if (Meteor.isClient) {
  Meteor.subscribe('userData');
  Meteor.subscribe('attendees');

  Template.footer.events({
    'click .login' : function(evt, tmpl){
      Meteor.loginWithGithub();
      return false;
    },

    'click .admin' : function(evt, tmpl){
      Session.set("showAdmin", !Session.get("showAdmin"));
    }
   });

  Template.registration.events({
    'submit form' : function (evt, tmpl) {
      var name = tmpl.find('#name').value;
      var company = tmpl.find('#company').value;
      var twitter = tmpl.find('#twitter').value;
      var email = tmpl.find('#email').value
      , doc = {name: name, email: email, company: company, twitter_id: twitter, referrer: document.referrer, timestamp: new Date()};

      if (EMAIL_REGEX.test(email)){
        Session.set("showBadEmail", false);
        Meteor.call("insertAttendee", doc);
        Session.set("registrationSubmitted", true);
      } else {
        Session.set("showBadEmail", true);
      }
      return false;
    }
  });

  Template.registration.showBadEmail = function () {
    return Session.get("showBadEmail");
  };

  Template.registration.registrationSubmitted = function () {
    return Session.get("registrationSubmitted");
  };

  Template.footer.isAdmin = function() {
    return isAdmin(Meteor.userId());
  };

  Template.main.showAdmin = function() {
    return Session.get("showAdmin");
  };

  Template.admin.attendees = function() {
    return Attendees.find().fetch();
  };

  Template.wall.attendees = function() {
    console.log('Accessing ' + location.href);
    return Attendees.find().fetch();
  };

  Template.attendeeCount.n = function() {
    return Attendees.find().count();
  };
}

/////////// Server

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });

  var Future = Npm.require('fibers/future');

  Meteor.publish("userData", function () {
    return Meteor.users.find({_id: this.userId},
      {fields: {'services.github.username': 1, 'username':1}});
  });

  Meteor.publish("attendees", function() {
    // if (isAdmin(this.userId)) {
      return Attendees.find();
    // }
  });
  
  Meteor.methods({
      insertAttendee: function(doc) {
          Attendees.insert(doc);
      }
  });
}

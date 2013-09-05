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

Router.map(function () {
  this.route('main', {
    path: '/'
  });

  this.route('wall', {
    controller: 'WallController',
    action: 'customAction'
  });
});

/////////// Client

if (Meteor.isClient) {

  var id = 0,
  cache = [];
        
  Handlebars.registerHelper("bindData", function(data) {
    var dataKey = id++;
    cache[dataKey] = data;

    return "data-handlebar-id=" + dataKey;
  });

  Handlebars.getBoundData = function(handlebarId) {
    if (typeof(handlebarId) !== "string") {
        // If a string was not passed in, it is the html element, so grab it's id.
        handlebarId = handlebarId.getAttribute("data-handlebar-id");
    }

    return cache[handlebarId];
  };

  Router.configure({
    layout: 'layout',
  });

  Subscriptions = {
    userData: Meteor.subscribe('userData'),
    attendees: Meteor.subscribe('attendees')
  };
  
  WallController = RouteController.extend({
    template: 'wall',

    waitOn: Subscriptions['attendees'],

    data: function() {
      return {
        attendees: Attendees.find({}, {sort:{timestamp: -1}})
      };
    },

    customAction: function() {

      this.render('wall');
      setInterval(function() {
        $('.js-timeago').each(function() {
          var me = $(this);
          me.text(moment(me.data('time')).fromNow());
        })
      }, 1000)
    }
  });



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
    },

    'click .rearrival' : function(evt, tmpl) {
      Session.set("registrationSubmitted", false);
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

  // Template.wall.attendees = function() {
  //   console.log('Accessing ' + location.href);
  //   return Attendees.find().fetch();
  // };
  var first_render = false;
  Template.wall.rendered = function() {
    first_render = true;
  }
  Template.attendee_desktop.rendered = function() {
    console.log(first_render);
    if (first_render) {
      $(this.firstNode).animate({
        lineHeight: '40px',
        opacity: 1
      }, 700);
    } else {
      $(this.firstNode).css({lineHeight: '40px', opacity: 1});
    }
  }
  Template.attendee_mobile.rendered = function() {
    $(this.firstNode).animate({
      lineHeight: '40px',
      opacity: 1
    }, 1000);
  }
  Template.attendeeCount.n = function() {
    return Attendees.find().count();
  };

  Handlebars.registerHelper('timeAgo', function(context, options) {
    //var f = options.hash.format || "MMM Do, YYYY";
    // return moment(Date(context)).format(f);
    return moment(context).fromNow();
});

}

/////////// Server

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });

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

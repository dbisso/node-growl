
// Growl - Copyright TJ Holowaychuk <tj@vision-media.ca> (MIT Licensed)

/**
 * Module dependencies.
 */

var exec = require('child_process').exec
  , path = require('path')
  , os = require('os')
  , cmd;

switch(os.type()) {
  case 'Darwin':
    cmd = {
        type: "Darwin"
      , pkg: "growlnotify"
      , msg: '-m'
      , sticky: '--sticky'
      , wait: '-w'
      , identifier: '-d'
      , priority: {
            cmd: '--priority'
          , range: [
              -2
            , -1
            , 0
            , 1
            , 2
            , "Very Low"
            , "Moderate"
            , "Normal"
            , "High"
            , "Emergency"
          ]
        }
    };
    break;
  case 'Linux':
    cmd = {
        type: "Linux"
      , pkg: "notify-send"
      , msg: ''
      , sticky: '-t 0'
      , priority: {
          cmd: '-u'
        , range: [
            "low"
          , "normal"
          , "critical"
        ]
      }
    };
}

/**
 * Expose `growl`.
 */

exports = module.exports = growl;

/**
 * Node-growl version.
 */

exports.version = '1.4.1'

/**
 * Send growl notification _msg_ with _options_.
 *
 * Options:
 *
 *  - title   Notification title
 *  - sticky  Make the notification stick (defaults to false)
 *  - priority  Specify an int or named key (default is 0)
 *  - name  Application name (defaults to growlnotify)
 *  - wait   Wait for notification to be dismissed or timeout
 *  - identifier  Unique identifier for coalescing  
 *  - image
 *    - path to an icon sets --iconpath
 *    - path to an image sets --image
 *    - capitalized word sets --appIcon
 *    - filename uses extname as --icon
 *    - otherwise treated as --icon
 *
 * Examples:
 *
 *   growl('New email')
 *   growl('5 new emails', { title: 'Thunderbird' })
 *   growl('Email sent', function(){
 *     // ... notification sent
 *   })
 *
 * @param {string} msg
 * @param {object} options
 * @param {function} fn
 * @api public
 */

function growl(msg, options, fn) {
  var image
    , args = [cmd.pkg]
    , options = options || {}
    , fn = fn || function(){};

  // noop
  if (!cmd) return fn(new Error('growl not supported on this platform'));

  // image
  if (image = options.image) {
    switch(cmd.type) {
      case 'Darwin':
        var flag, ext = path.extname(image).substr(1)
        flag = flag || ext == 'icns' && 'iconpath'
        flag = flag || /^[A-Z]/.test(image) && 'appIcon'
        flag = flag || /^png|gif|jpe?g$/.test(ext) && 'image'
        flag = flag || ext && (image = ext) && 'icon'
        flag = flag || 'icon'
        args.push('--' + flag, image)
        break;
      case 'Linux':
        args.push('-i ' + image);
        break;
    }
  }

  // sticky
  if (options.sticky) args.push(cmd.sticky);

  // priority
  if (options.priority) {
    var priority = options.priority + '';
    var checkindexOf = cmd.priority.range.indexOf(priority);
    if (~cmd.priority.range.indexOf(priority)) {
      args.push(cmd.priority, options.priority);
    }
  }

  // name
  if (options.name && cmd.type === "Darwin") {
    args.push('--name', options.name);
  }

  if (options.wait) args.push(cmd.wait);

  if (options.identifier) args.push(cmd.identifier + ' ' + options.identifier);

  switch(cmd.type) {
    case 'Darwin':
      args.push(cmd.msg);
      args.push('"' + msg + '"');
      if (options.title) args.push(options.title);
      break;
    case 'Linux':
      if (options.title) {
        args.push("'" + options.title + "'");
        args.push(cmd.msg);
        args.push("'" + msg + "'");
      } else {
        args.push("'" + msg + "'");
      }
      break;
  }

  // execute
  exec(args.join(' '), fn);
}

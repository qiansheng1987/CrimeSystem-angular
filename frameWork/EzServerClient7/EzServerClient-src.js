/*
 EzServerClient, 方正国际（北京）有限公司. 
 V.7.0.0
*/
(function (window, document, undefined) {
var oldL = window.EzServerClient,
    EzServerClient = {};

EzServerClient.version = '0.7.3';

// define Leaflet for Node module pattern loaders, including Browserify
if (typeof module === 'object' && typeof module.exports === 'object') {
	module.exports = EzServerClient;

// define Leaflet as an AMD module
} else if (typeof define === 'function' && define.amd) {
	define(EzServerClient);
}

// define Leaflet as a global EzServerClient.variable, saving the original EzServerClient.to restore later if needed

EzServerClient.noConflict = function () {
	window.EzServerClient = oldL;
	return this;
};

window.EzServerClient = EzServerClient;


/*
 * EzServerClient.Util contains various utility functions used throughout Leaflet code.
 */

EzServerClient.Util = {
	extend: function (dest) { // (Object[, Object, ...]) ->
		var sources = Array.prototype.slice.call(arguments, 1),
		    i, j, len, src;

		for (j = 0, len = sources.length; j < len; j++) {
			src = sources[j] || {};
			for (i in src) {
				if (src.hasOwnProperty(i)) {
					dest[i] = src[i];
				}
			}
		}
		return dest;
	},

	bind: function (fn, obj) { // (Function, Object) -> Function
		var args = arguments.length > 2 ? Array.prototype.slice.call(arguments, 2) : null;
		return function () {
			return fn.apply(obj, args || arguments);
		};
	},

	stamp: (function () {
		var lastId = 0,
		    key = '_leaflet_id';
		return function (obj) {
			obj[key] = obj[key] || ++lastId;
			return obj[key];
		};
	}()),

	invokeEach: function (obj, method, context) {
		var i, args;

		if (typeof obj === 'object') {
			args = Array.prototype.slice.call(arguments, 3);

			for (i in obj) {
				method.apply(context, [i, obj[i]].concat(args));
			}
			return true;
		}

		return false;
	},

	limitExecByInterval: function (fn, time, context) {
		var lock, execOnUnlock;

		return function wrapperFn() {
			var args = arguments;

			if (lock) {
				execOnUnlock = true;
				return;
			}

			lock = true;

			setTimeout(function () {
				lock = false;

				if (execOnUnlock) {
					wrapperFn.apply(context, args);
					execOnUnlock = false;
				}
			}, time);

			fn.apply(context, args);
		};
	},

	falseFn: function () {
		return false;
	},

	formatNum: function (num, digits) {
		var pow = Math.pow(10, digits || 5);
		return Math.round(num * pow) / pow;
	},

	trim: function (str) {
		return str.trim ? str.trim() : str.replace(/^\s+|\s+$/g, '');
	},

	splitWords: function (str) {
		return EzServerClient.Util.trim(str).split(/\s+/);
	},

	setOptions: function (obj, options) {
		obj.options = EzServerClient.extend({}, obj.options, options);
		return obj.options;
	},

	getParamString: function (obj, existingUrl, uppercase) {
		var params = [];
		for (var i in obj) {
			params.push(encodeURIComponent(uppercase ? i.toUpperCase() : i) + '=' + encodeURIComponent(obj[i]));
		}
		return ((!existingUrl || existingUrl.indexOf('?') === -1) ? '?' : '&') + params.join('&');
	},
	template: function (str, data) {
		return str.replace(/\{ *([\w_]+) *\}/g, function (str, key) {
			var value = data[key];
			if (value === undefined) {
				throw new Error('No value provided for variable ' + str);
			} else if (typeof value === 'function') {
				value = value(data);
			}
			return value;
		});
	},

	isArray: Array.isArray || function (obj) {
		return (Object.prototype.toString.call(obj) === '[object Array]');
	},

	emptyImageUrl: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='
};

(function () {

	// inspired by http://paulirish.com/2011/requestanimationframe-for-smart-animating/

	function getPrefixed(name) {
		var i, fn,
		    prefixes = ['webkit', 'moz', 'o', 'ms'];

		for (i = 0; i < prefixes.length && !fn; i++) {
			fn = window[prefixes[i] + name];
		}

		return fn;
	}

	var lastTime = 0;

	function timeoutDefer(fn) {
		var time = +new Date(),
		    timeToCall = Math.max(0, 16 - (time - lastTime));

		lastTime = time + timeToCall;
		return window.setTimeout(fn, timeToCall);
	}

	var requestFn = window.requestAnimationFrame ||
	        getPrefixed('RequestAnimationFrame') || timeoutDefer;

	var cancelFn = window.cancelAnimationFrame ||
	        getPrefixed('CancelAnimationFrame') ||
	        getPrefixed('CancelRequestAnimationFrame') ||
	        function (id) { window.clearTimeout(id); };


	EzServerClient.Util.requestAnimFrame = function (fn, context, immediate, element) {
		fn = EzServerClient.bind(fn, context);

		if (immediate && requestFn === timeoutDefer) {
			fn();
		} else {
			return requestFn.call(window, fn, element);
		}
	};

	EzServerClient.Util.cancelAnimFrame = function (id) {
		if (id) {
			cancelFn.call(window, id);
		}
	};

}());

// shortcuts for most used utility functions
EzServerClient.extend = EzServerClient.Util.extend;
EzServerClient.bind = EzServerClient.Util.bind;
EzServerClient.stamp = EzServerClient.Util.stamp;
EzServerClient.setOptions = EzServerClient.Util.setOptions;


/*
 * EzServerClient.Class powers the OOP facilities of the library.
 * Thanks to John Resig and Dean Edwards for inspiration!
 */

EzServerClient.Class = function () {};

EzServerClient.Class.extend = function (props) {

	// extended class with the new prototype
	var NewClass = function () {

		// call the constructor
		if (this.initialize) {
			this.initialize.apply(this, arguments);
		}

		// call all constructor hooks
		if (this._initHooks) {
			this.callInitHooks();
		}
	};

	// instantiate class without calling constructor
	var F = function () {};
	F.prototype = this.prototype;

	var proto = new F();
	proto.constructor = NewClass;

	NewClass.prototype = proto;

	//inherit parent's statics
	for (var i in this) {
		if (this.hasOwnProperty(i) && i !== 'prototype') {
			NewClass[i] = this[i];
		}
	}

	// mix static properties into the class
	if (props.statics) {
		EzServerClient.extend(NewClass, props.statics);
		delete props.statics;
	}

	// mix includes into the prototype
	if (props.includes) {
		EzServerClient.Util.extend.apply(null, [proto].concat(props.includes));
		delete props.includes;
	}

	// merge options
	if (props.options && proto.options) {
		props.options = EzServerClient.extend({}, proto.options, props.options);
	}

	// mix given properties into the prototype
	EzServerClient.extend(proto, props);

	proto._initHooks = [];

	var parent = this;
	// jshint camelcase: false
	NewClass.__super__ = parent.prototype;

	// add method for calling all hooks
	proto.callInitHooks = function () {

		if (this._initHooksCalled) { return; }

		if (parent.prototype.callInitHooks) {
			parent.prototype.callInitHooks.call(this);
		}

		this._initHooksCalled = true;

		for (var i = 0, len = proto._initHooks.length; i < len; i++) {
			proto._initHooks[i].call(this);
		}
	};

	return NewClass;
};


// method for adding properties to prototype
EzServerClient.Class.include = function (props) {
	EzServerClient.extend(this.prototype, props);
};

// merge new default options to the Class
EzServerClient.Class.mergeOptions = function (options) {
	EzServerClient.extend(this.prototype.options, options);
};

// add a constructor hook
EzServerClient.Class.addInitHook = function (fn) { // (Function) || (String, args...)
	var args = Array.prototype.slice.call(arguments, 1);

	var init = typeof fn === 'function' ? fn : function () {
		this[fn].apply(this, args);
	};

	this.prototype._initHooks = this.prototype._initHooks || [];
	this.prototype._initHooks.push(init);
};


/*
 * EzServerClient.Mixin.Events is used to add custom events functionality to Leaflet classes.
 */

var eventsKey = '_leaflet_events';

EzServerClient.Mixin = {};

EzServerClient.Mixin.Events = {

	addEventListener: function (types, fn, context) { // (String, Function[, Object]) or (Object[, Object])

		// types can be a map of types/handlers
		if (EzServerClient.Util.invokeEach(types, this.addEventListener, this, fn, context)) { return this; }

		var events = this[eventsKey] = this[eventsKey] || {},
		    contextId = context && context !== this && EzServerClient.stamp(context),
		    i, len, event, type, indexKey, indexLenKey, typeIndex;

		// types can be a string of space-separated words
		types = EzServerClient.Util.splitWords(types);

		for (i = 0, len = types.length; i < len; i++) {
			event = {
				action: fn,
				context: context || this
			};
			type = types[i];

			if (contextId) {
				// store listeners of a particular context in a separate hash (if it has an id)
				// gives a major performance boost when removing thousands of map layers

				indexKey = type + '_idx';
				indexLenKey = indexKey + '_len';

				typeIndex = events[indexKey] = events[indexKey] || {};

				if (!typeIndex[contextId]) {
					typeIndex[contextId] = [];

					// keep track of the number of keys in the index to quickly check if it's empty
					events[indexLenKey] = (events[indexLenKey] || 0) + 1;
				}

				typeIndex[contextId].push(event);


			} else {
				events[type] = events[type] || [];
				events[type].push(event);
			}
		}

		return this;
	},

	hasEventListeners: function (type) { // (String) -> Boolean
		var events = this[eventsKey];
		return !!events && ((type in events && events[type].length > 0) ||
		                    (type + '_idx' in events && events[type + '_idx_len'] > 0));
	},

	removeEventListener: function (types, fn, context) { // ([String, Function, Object]) or (Object[, Object])

		if (!this[eventsKey]) {
			return this;
		}

		if (!types) {
			return this.clearAllEventListeners();
		}

		if (EzServerClient.Util.invokeEach(types, this.removeEventListener, this, fn, context)) { return this; }

		var events = this[eventsKey],
		    contextId = context && context !== this && EzServerClient.stamp(context),
		    i, len, type, listeners, j, indexKey, indexLenKey, typeIndex, removed;

		types = EzServerClient.Util.splitWords(types);

		for (i = 0, len = types.length; i < len; i++) {
			type = types[i];
			indexKey = type + '_idx';
			indexLenKey = indexKey + '_len';

			typeIndex = events[indexKey];

			if (!fn) {
				// clear all listeners for a type if function isn't specified
				delete events[type];
				delete events[indexKey];
				delete events[indexLenKey];

			} else {
				listeners = contextId && typeIndex ? typeIndex[contextId] : events[type];

				if (listeners) {
					for (j = listeners.length - 1; j >= 0; j--) {
						if ((listeners[j].action === fn) && (!context || (listeners[j].context === context))) {
							removed = listeners.splice(j, 1);
							// set the old action to a no-op, because it is possible
							// that the listener is being iterated over as part of a dispatch
							removed[0].action = EzServerClient.Util.falseFn;
						}
					}

					if (context && typeIndex && (listeners.length === 0)) {
						delete typeIndex[contextId];
						events[indexLenKey]--;
					}
				}
			}
		}

		return this;
	},

	clearAllEventListeners: function () {
		delete this[eventsKey];
		return this;
	},

	fireEvent: function (type, data) { // (String[, Object])
		if (!this.hasEventListeners(type)) {
			return this;
		}

		var event = EzServerClient.Util.extend({}, data, { type: type, target: this });

		var events = this[eventsKey],
		    listeners, i, len, typeIndex, contextId;

		if (events[type]) {
			// make sure adding/removing listeners inside other listeners won't cause infinite loop
			listeners = events[type].slice();

			for (i = 0, len = listeners.length; i < len; i++) {
				listeners[i].action.call(listeners[i].context, event);
			}
		}

		// fire event for the context-indexed listeners as well
		typeIndex = events[type + '_idx'];

		for (contextId in typeIndex) {
			listeners = typeIndex[contextId].slice();

			if (listeners) {
				for (i = 0, len = listeners.length; i < len; i++) {
					listeners[i].action.call(listeners[i].context, event);
				}
			}
		}

		return this;
	},

	addOneTimeEventListener: function (types, fn, context) {

		if (EzServerClient.Util.invokeEach(types, this.addOneTimeEventListener, this, fn, context)) { return this; }

		var handler = EzServerClient.bind(function () {
			this
			    .removeEventListener(types, fn, context)
			    .removeEventListener(types, handler, context);
		}, this);

		return this
		    .addEventListener(types, fn, context)
		    .addEventListener(types, handler, context);
	}
};

EzServerClient.Mixin.Events.on = EzServerClient.Mixin.Events.addEventListener;
EzServerClient.Mixin.Events.off = EzServerClient.Mixin.Events.removeEventListener;
EzServerClient.Mixin.Events.once = EzServerClient.Mixin.Events.addOneTimeEventListener;
EzServerClient.Mixin.Events.fire = EzServerClient.Mixin.Events.fireEvent;


/*
 * EzServerClient.Browser handles different browser and feature detections for internal Leaflet use.
 */

(function () {

	var ie = 'ActiveXObject' in window,
		ielt9 = ie && !document.addEventListener,

	    // terrible browser detection to work around Safari / iOS / Android browser bugs
	    ua = navigator.userAgent.toLowerCase(),
	    webkit = ua.indexOf('webkit') !== -1,
	    chrome = ua.indexOf('chrome') !== -1,
	    phantomjs = ua.indexOf('phantom') !== -1,
	    android = ua.indexOf('android') !== -1,
	    android23 = ua.search('android [23]') !== -1,
		gecko = ua.indexOf('gecko') !== -1,

	    mobile = typeof orientation !== undefined + '',
	    msPointer = window.navigator && window.navigator.msPointerEnabled &&
	              window.navigator.msMaxTouchPoints && !window.PointerEvent,
		pointer = (window.PointerEvent && window.navigator.pointerEnabled && window.navigator.maxTouchPoints) ||
				  msPointer,
	    retina = ('devicePixelRatio' in window && window.devicePixelRatio > 1) ||
	             ('matchMedia' in window && window.matchMedia('(min-resolution:144dpi)') &&
	              window.matchMedia('(min-resolution:144dpi)').matches),

	    doc = document.documentElement,
	    ie3d = ie && ('transition' in doc.style),
	    webkit3d = ('WebKitCSSMatrix' in window) && ('m11' in new window.WebKitCSSMatrix()) && !android23,
	    gecko3d = 'MozPerspective' in doc.style,
	    opera3d = 'OTransition' in doc.style,
	    any3d = !window.L_DISABLE_3D && (ie3d || webkit3d || gecko3d || opera3d) && !phantomjs;


	// PhantomJS has 'ontouchstart' in document.documentElement, but doesn't actually support touch.
	// https://github.com/Leaflet/Leaflet/pull/1434#issuecomment-13843151

	var touch = !window.L_NO_TOUCH && !phantomjs && (function () {

		var startName = 'ontouchstart';

		// IE10+ (We simulate these into touch* events in EzServerClient.DomEvent and EzServerClient.DomEvent.Pointer) or WebKit, etc.
		if (pointer || (startName in doc)) {
			return true;
		}

		// Firefox/Gecko
		var div = document.createElement('div'),
		    supported = false;

		if (!div.setAttribute) {
			return false;
		}
		div.setAttribute(startName, 'return;');

		if (typeof div[startName] === 'function') {
			supported = true;
		}

		div.removeAttribute(startName);
		div = null;

		return supported;
	}());


	EzServerClient.Browser = {
		ie: ie,
		ielt9: ielt9,
		webkit: webkit,
		gecko: gecko && !webkit && !window.opera && !ie,

		android: android,
		android23: android23,

		chrome: chrome,

		ie3d: ie3d,
		webkit3d: webkit3d,
		gecko3d: gecko3d,
		opera3d: opera3d,
		any3d: any3d,

		mobile: mobile,
		mobileWebkit: mobile && webkit,
		mobileWebkit3d: mobile && webkit3d,
		mobileOpera: mobile && window.opera,

		touch: touch,
		msPointer: msPointer,
		pointer: pointer,

		retina: retina
	};

}());


/*
 * EzServerClient.Point represents a point with x and y coordinates.
 */

EzServerClient.Point = function (/*Number*/ x, /*Number*/ y, /*Boolean*/ round) {
	this.x = (round ? Math.round(x) : x);
	this.y = (round ? Math.round(y) : y);
};

EzServerClient.Point.prototype = {

	clone: function () {
		return new EzServerClient.Point(this.x, this.y);
	},

	// non-destructive, returns a new point
	add: function (point) {
		return this.clone()._add(EzServerClient.point(point));
	},

	// destructive, used directly for performance in situations where it's safe to modify existing point
	_add: function (point) {
		this.x += point.x;
		this.y += point.y;
		return this;
	},

	subtract: function (point) {
		return this.clone()._subtract(EzServerClient.point(point));
	},

	_subtract: function (point) {
		this.x -= point.x;
		this.y -= point.y;
		return this;
	},

	divideBy: function (num) {
		return this.clone()._divideBy(num);
	},

	_divideBy: function (num) {
		this.x /= num;
		this.y /= num;
		return this;
	},

	multiplyBy: function (num) {
		return this.clone()._multiplyBy(num);
	},

	_multiplyBy: function (num) {
		this.x *= num;
		this.y *= num;
		return this;
	},

	round: function () {
		return this.clone()._round();
	},

	_round: function () {
		this.x = Math.round(this.x);
		this.y = Math.round(this.y);
		return this;
	},

	floor: function () {
		return this.clone()._floor();
	},

	_floor: function () {
		this.x = Math.floor(this.x);
		this.y = Math.floor(this.y);
		return this;
	},

	distanceTo: function (point) {
		point = EzServerClient.point(point);

		var x = point.x - this.x,
		    y = point.y - this.y;

		return Math.sqrt(x * x + y * y);
	},

	equals: function (point) {
		point = EzServerClient.point(point);

		return point.x === this.x &&
		       point.y === this.y;
	},

	contains: function (point) {
		point = EzServerClient.point(point);

		return Math.abs(point.x) <= Math.abs(this.x) &&
		       Math.abs(point.y) <= Math.abs(this.y);
	},

	toString: function () {
		return 'Point(' +
		        EzServerClient.Util.formatNum(this.x) + ', ' +
		        EzServerClient.Util.formatNum(this.y) + ')';
	},

	/**
	 * 2014.9.10
	 * @author qianleyi
	 * @description EzServerClient Point 增加方法
	 */
	approxEquals: function(otherpoint) {
		if (this.subtract(otherpoint) < 10E-6) {
			return true;
		} else {
			return false;
		}
	},

	getCoordSequence: function() {
		return EzServerClient.Util.formatNum(this.x) + ', ' +EzServerClient.Util.formatNum(this.y) ;
	},

	getGeometryType: function() {
		return "Point";
	},

	pointTypeConvert:function(){
		return new EzServerClient.Point(this.y,this.x);
	}
};

EzServerClient.point = function (x, y, round) {
	if (x instanceof EzServerClient.Point) {
		return x;
	}
	if (EzServerClient.Util.isArray(x)) {
		return new EzServerClient.Point(x[0], x[1]);
	}
	if (typeof x === 'string') {
		var temp = x.split(',');
		return new EzServerClient.Point(temp[1],temp[0]);
	}
	if (x === undefined || x === null) {
		return x;
	}
	return new EzServerClient.Point(x, y, round);
};


/*
 * EzServerClient.Bounds represents a rectangular area on the screen in pixel coordinates.
 */

EzServerClient.Bounds = function (a, b) { //(Point, Point) or Point[]
	if (!a) { return; }

	var points = b ? [a, b] : a;

	for (var i = 0, len = points.length; i < len; i++) {
		this.extend(points[i]);
	}
};

EzServerClient.Bounds.prototype = {
	// extend the bounds to contain the given point
	extend: function (point) { // (Point)
		point = EzServerClient.point(point);

		if (!this.min && !this.max) {
			this.min = point.clone();
			this.max = point.clone();
		} else {
			this.min.x = Math.min(point.x, this.min.x);
			this.max.x = Math.max(point.x, this.max.x);
			this.min.y = Math.min(point.y, this.min.y);
			this.max.y = Math.max(point.y, this.max.y);
		}
		return this;
	},

	getCenter: function (round) { // (Boolean) -> Point
		return new EzServerClient.Point(
		        (this.min.x + this.max.x) / 2,
		        (this.min.y + this.max.y) / 2, round);
	},

	getBottomLeft: function () { // -> Point
		return new EzServerClient.Point(this.min.x, this.max.y);
	},

	getTopRight: function () { // -> Point
		return new EzServerClient.Point(this.max.x, this.min.y);
	},

	getSize: function () {
		return this.max.subtract(this.min);
	},

	contains: function (obj) { // (Bounds) or (Point) -> Boolean
		var min, max;

		if (typeof obj[0] === 'number' || obj instanceof EzServerClient.Point) {
			obj = EzServerClient.point(obj);
		} else {
			obj = EzServerClient.bounds(obj);
		}

		if (obj instanceof EzServerClient.Bounds) {
			min = obj.min;
			max = obj.max;
		} else {
			min = max = obj;
		}

		return (min.x >= this.min.x) &&
		       (max.x <= this.max.x) &&
		       (min.y >= this.min.y) &&
		       (max.y <= this.max.y);
	},

	intersects: function (bounds) { // (Bounds) -> Boolean
		bounds = EzServerClient.bounds(bounds);

		var min = this.min,
		    max = this.max,
		    min2 = bounds.min,
		    max2 = bounds.max,
		    xIntersects = (max2.x >= min.x) && (min2.x <= max.x),
		    yIntersects = (max2.y >= min.y) && (min2.y <= max.y);

		return xIntersects && yIntersects;
	},

	isValid: function () {
		return !!(this.min && this.max);
	}
};

EzServerClient.bounds = function (a, b) { // (Bounds) or (Point, Point) or (Point[])
	if (!a || a instanceof EzServerClient.Bounds) {
		return a;
	}
	return new EzServerClient.Bounds(a, b);
};


/*
 * EzServerClient.Transformation is an utility class to perform simple point transformations through a 2d-matrix.
 */

EzServerClient.Transformation = function (a, b, c, d) {
	this._a = a;
	this._b = b;
	this._c = c;
	this._d = d;
};

EzServerClient.Transformation.prototype = {
	transform: function (point, scale) { // (Point, Number) -> Point
		return this._transform(point.clone(), scale);
	},

	// destructive transform (faster)
	_transform: function (point, scale) {
		scale = scale || 1;
		point.x = scale * (this._a * point.x + this._b);
		point.y = scale * (this._c * point.y + this._d);
		return point;
	},

	untransform: function (point, scale) {
		scale = scale || 1;
		return new EzServerClient.Point(
		        (point.x / scale - this._b) / this._a,
		        (point.y / scale - this._d) / this._c);
	}
};


/*
 * EzServerClient.DomUtil contains various utility functions for working with DOM.
 */

EzServerClient.DomUtil = {
	get: function (id) {
		return (typeof id === 'string' ? document.getElementById(id) : id);
	},

	getStyle: function (el, style) {

		var value = el.style[style];

		if (!value && el.currentStyle) {
			value = el.currentStyle[style];
		}

		if ((!value || value === 'auto') && document.defaultView) {
			var css = document.defaultView.getComputedStyle(el, null);
			value = css ? css[style] : null;
		}

		return value === 'auto' ? null : value;
	},

	getViewportOffset: function (element) {

		var top = 0,
		    left = 0,
		    el = element,
		    docBody = document.body,
		    docEl = document.documentElement,
		    pos;

		do {
			top  += el.offsetTop  || 0;
			left += el.offsetLeft || 0;

			//add borders
			top += parseInt(EzServerClient.DomUtil.getStyle(el, 'borderTopWidth'), 10) || 0;
			left += parseInt(EzServerClient.DomUtil.getStyle(el, 'borderLeftWidth'), 10) || 0;

			pos = EzServerClient.DomUtil.getStyle(el, 'position');

			if (el.offsetParent === docBody && pos === 'absolute') { break; }

			if (pos === 'fixed') {
				top  += docBody.scrollTop  || docEl.scrollTop  || 0;
				left += docBody.scrollLeft || docEl.scrollLeft || 0;
				break;
			}

			if (pos === 'relative' && !el.offsetLeft) {
				var width = EzServerClient.DomUtil.getStyle(el, 'width'),
				    maxWidth = EzServerClient.DomUtil.getStyle(el, 'max-width'),
				    r = el.getBoundingClientRect();

				if (width !== 'none' || maxWidth !== 'none') {
					left += r.left + el.clientLeft;
				}

				//calculate full y offset since we're breaking out of the loop
				top += r.top + (docBody.scrollTop  || docEl.scrollTop  || 0);

				break;
			}

			el = el.offsetParent;

		} while (el);

		el = element;

		do {
			if (el === docBody) { break; }

			top  -= el.scrollTop  || 0;
			left -= el.scrollLeft || 0;

			el = el.parentNode;
		} while (el);

		return new EzServerClient.Point(left, top);
	},

	documentIsLtr: function () {
		if (!EzServerClient.DomUtil._docIsLtrCached) {
			EzServerClient.DomUtil._docIsLtrCached = true;
			EzServerClient.DomUtil._docIsLtr = EzServerClient.DomUtil.getStyle(document.body, 'direction') === 'ltr';
		}
		return EzServerClient.DomUtil._docIsLtr;
	},

	create: function (tagName, className, container) {

		var el = document.createElement(tagName);
		el.className = className;

		if (container) {
			container.appendChild(el);
		}

		return el;
	},

	hasClass: function (el, name) {
		if (el.classList !== undefined) {
			return el.classList.contains(name);
		}
		var className = EzServerClient.DomUtil._getClass(el);
		return className.length > 0 && new RegExp('(^|\\s)' + name + '(\\s|$)').test(className);
	},

	addClass: function (el, name) {
		if (el.classList !== undefined) {
			var classes = EzServerClient.Util.splitWords(name);
			for (var i = 0, len = classes.length; i < len; i++) {
				el.classList.add(classes[i]);
			}
		} else if (!EzServerClient.DomUtil.hasClass(el, name)) {
			var className = EzServerClient.DomUtil._getClass(el);
			EzServerClient.DomUtil._setClass(el, (className ? className + ' ' : '') + name);
		}
	},

	removeClass: function (el, name) {
		if (el.classList !== undefined) {
			el.classList.remove(name);
		} else {
			EzServerClient.DomUtil._setClass(el, EzServerClient.Util.trim((' ' + EzServerClient.DomUtil._getClass(el) + ' ').replace(' ' + name + ' ', ' ')));
		}
	},

	_setClass: function (el, name) {
		if (el.className.baseVal === undefined) {
			el.className = name;
		} else {
			// in case of SVG element
			el.className.baseVal = name;
		}
	},

	_getClass: function (el) {
		return el.className.baseVal === undefined ? el.className : el.className.baseVal;
	},

	setOpacity: function (el, value) {

		if ('opacity' in el.style) {
			el.style.opacity = value;

		} else if ('filter' in el.style) {

			var filter = false,
			    filterName = 'DXImageTransform.Microsoft.Alpha';

			// filters collection throws an error if we try to retrieve a filter that doesn't exist
			try {
				filter = el.filters.item(filterName);
			} catch (e) {
				// don't set opacity to 1 if we haven't already set an opacity,
				// it isn't needed and breaks transparent pngs.
				if (value === 1) { return; }
			}

			value = Math.round(value * 100);

			if (filter) {
				filter.Enabled = (value !== 100);
				filter.Opacity = value;
			} else {
				el.style.filter += ' progid:' + filterName + '(opacity=' + value + ')';
			}
		}
	},

	testProp: function (props) {

		var style = document.documentElement.style;

		for (var i = 0; i < props.length; i++) {
			if (props[i] in style) {
				return props[i];
			}
		}
		return false;
	},

	getTranslateString: function (point) {
		// on WebKit browsers (Chrome/Safari/iOS Safari/Android) using translate3d instead of translate
		// makes animation smoother as it ensures HW accel is used. Firefox 13 doesn't care
		// (same speed either way), Opera 12 doesn't support translate3d

		var is3d = EzServerClient.Browser.webkit3d,
		    open = 'translate' + (is3d ? '3d' : '') + '(',
		    close = (is3d ? ',0' : '') + ')';

		return open + point.x + 'px,' + point.y + 'px' + close;
	},

	getScaleString: function (scale, origin) {

		var preTranslateStr = EzServerClient.DomUtil.getTranslateString(origin.add(origin.multiplyBy(-1 * scale))),
		    scaleStr = ' scale(' + scale + ') ';

		return preTranslateStr + scaleStr;
	},

	setPosition: function (el, point, disable3D) { // (HTMLElement, Point[, Boolean])

		// jshint camelcase: false
		el._leaflet_pos = point;

		if (!disable3D && EzServerClient.Browser.any3d) {
			el.style[EzServerClient.DomUtil.TRANSFORM] =  EzServerClient.DomUtil.getTranslateString(point);
		} else {
			el.style.left = point.x + 'px';
			el.style.top = point.y + 'px';
		}
	},

	getPosition: function (el) {
		// this method is only used for elements previously positioned using setPosition,
		// so it's safe to cache the position for performance

		// jshint camelcase: false
		return el._leaflet_pos;
	}
};


// prefix style property names

EzServerClient.DomUtil.TRANSFORM = EzServerClient.DomUtil.testProp(
        ['transform', 'WebkitTransform', 'OTransform', 'MozTransform', 'msTransform']);

// webkitTransition comes first because some browser versions that drop vendor prefix don't do
// the same for the transitionend event, in particular the Android 4.1 stock browser

EzServerClient.DomUtil.TRANSITION = EzServerClient.DomUtil.testProp(
        ['webkitTransition', 'transition', 'OTransition', 'MozTransition', 'msTransition']);

EzServerClient.DomUtil.TRANSITION_END =
        EzServerClient.DomUtil.TRANSITION === 'webkitTransition' || EzServerClient.DomUtil.TRANSITION === 'OTransition' ?
        EzServerClient.DomUtil.TRANSITION + 'End' : 'transitionend';

(function () {
    if ('onselectstart' in document) {
        EzServerClient.extend(EzServerClient.DomUtil, {
            disableTextSelection: function () {
                EzServerClient.DomEvent.on(window, 'selectstart', EzServerClient.DomEvent.preventDefault);
            },

            enableTextSelection: function () {
                EzServerClient.DomEvent.off(window, 'selectstart', EzServerClient.DomEvent.preventDefault);
            }
        });
    } else {
        var userSelectProperty = EzServerClient.DomUtil.testProp(
            ['userSelect', 'WebkitUserSelect', 'OUserSelect', 'MozUserSelect', 'msUserSelect']);

        EzServerClient.extend(EzServerClient.DomUtil, {
            disableTextSelection: function () {
                if (userSelectProperty) {
                    var style = document.documentElement.style;
                    this._userSelect = style[userSelectProperty];
                    style[userSelectProperty] = 'none';
                }
            },

            enableTextSelection: function () {
                if (userSelectProperty) {
                    document.documentElement.style[userSelectProperty] = this._userSelect;
                    delete this._userSelect;
                }
            }
        });
    }

	EzServerClient.extend(EzServerClient.DomUtil, {
		disableImageDrag: function () {
			EzServerClient.DomEvent.on(window, 'dragstart', EzServerClient.DomEvent.preventDefault);
		},

		enableImageDrag: function () {
			EzServerClient.DomEvent.off(window, 'dragstart', EzServerClient.DomEvent.preventDefault);
		}
	});
})();


/*
 * EzServerClient.LatLng represents a geographical point with latitude and longitude coordinates.
 */

EzServerClient.LatLng = function (lat, lng, alt) { // (Number, Number, Number)
	lat = parseFloat(lat);
	lng = parseFloat(lng);

	if (isNaN(lat) || isNaN(lng)) {
		throw new Error('Invalid LatLng object: (' + lat + ', ' + lng + ')');
	}

	this.lat = lat;
	this.lng = lng;

	if (alt !== undefined) {
		this.alt = parseFloat(alt);
	}
};

EzServerClient.extend(EzServerClient.LatLng, {
	DEG_TO_RAD: Math.PI / 180,
	RAD_TO_DEG: 180 / Math.PI,
	MAX_MARGIN: 1.0E-9 // max margin of error for the "equals" check
});

EzServerClient.LatLng.prototype = {
	equals: function (obj) { // (LatLng) -> Boolean
		if (!obj) { return false; }

		obj = EzServerClient.latLng(obj);

		var margin = Math.max(
		        Math.abs(this.lat - obj.lat),
		        Math.abs(this.lng - obj.lng));

		return margin <= EzServerClient.LatLng.MAX_MARGIN;
	},

	toString: function (precision) { // (Number) -> String
		return 'LatLng(' +
		        EzServerClient.Util.formatNum(this.lat, precision) + ', ' +
		        EzServerClient.Util.formatNum(this.lng, precision) + ')';
	},

	// Haversine distance formula, see http://en.wikipedia.org/wiki/Haversine_formula
	// TODO move to projection code, LatLng shouldn't know about Earth
	distanceTo: function (other) { // (LatLng) -> Number
		other = EzServerClient.latLng(other);

		var R = 6378137, // earth radius in meters
		    d2r = EzServerClient.LatLng.DEG_TO_RAD,
		    dLat = (other.lat - this.lat) * d2r,
		    dLon = (other.lng - this.lng) * d2r,
		    lat1 = this.lat * d2r,
		    lat2 = other.lat * d2r,
		    sin1 = Math.sin(dLat / 2),
		    sin2 = Math.sin(dLon / 2);

		var a = sin1 * sin1 + sin2 * sin2 * Math.cos(lat1) * Math.cos(lat2);

		return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	},

	wrap: function (a, b) { // (Number, Number) -> LatLng
		var lng = this.lng;

		a = a || -180;
		b = b ||  180;

		lng = (lng + b) % (b - a) + (lng < a || lng === b ? b : a);

		return new EzServerClient.LatLng(this.lat, lng);
	}
};

EzServerClient.latLng = function (a, b) { // (LatLng) or ([Number, Number]) or (Number, Number)
	if (a instanceof EzServerClient.LatLng) {
		return a;
	}
	if (EzServerClient.Util.isArray(a)) {
		if (typeof a[0] === 'number' || typeof a[0] === 'string') {
			return new EzServerClient.LatLng(a[0], a[1], a[2]);
		} else {
			return null;
		}
	}
	if (a === undefined || a === null) {
		return a;
	}
	if (typeof a === 'object' && 'lat' in a) {
		return new EzServerClient.LatLng(a.lat, 'lng' in a ? a.lng : a.lon);
	}
	if (b === undefined) {
		return null;
	}
	return new EzServerClient.LatLng(a, b);
};



/*
 * EzServerClient.LatLngBounds represents a rectangular area on the map in geographical coordinates.
 */

EzServerClient.LatLngBounds = function (southWest, northEast) { // (LatLng, LatLng) or (LatLng[])
	if (!southWest) { return; }

	var latlngs = northEast ? [southWest, northEast] : southWest;

	for (var i = 0, len = latlngs.length; i < len; i++) {
		this.extend(latlngs[i]);
	}
};

EzServerClient.LatLngBounds.prototype = {
	// extend the bounds to contain the given point or bounds
	extend: function (obj) { // (LatLng) or (LatLngBounds)
		if (!obj) { return this; }

		var latLng = EzServerClient.latLng(obj);
		if (latLng !== null) {
			obj = latLng;
		} else {
			obj = EzServerClient.latLngBounds(obj);
		}

		if (obj instanceof EzServerClient.LatLng) {
			if (!this._southWest && !this._northEast) {
				this._southWest = new EzServerClient.LatLng(obj.lat, obj.lng);
				this._northEast = new EzServerClient.LatLng(obj.lat, obj.lng);
			} else {
				this._southWest.lat = Math.min(obj.lat, this._southWest.lat);
				this._southWest.lng = Math.min(obj.lng, this._southWest.lng);

				this._northEast.lat = Math.max(obj.lat, this._northEast.lat);
				this._northEast.lng = Math.max(obj.lng, this._northEast.lng);
			}
		} else if (obj instanceof EzServerClient.LatLngBounds) {
			this.extend(obj._southWest);
			this.extend(obj._northEast);
		}
		return this;
	},

	// extend the bounds by a percentage
	pad: function (bufferRatio) { // (Number) -> LatLngBounds
		var sw = this._southWest,
		    ne = this._northEast,
		    heightBuffer = Math.abs(sw.lat - ne.lat) * bufferRatio,
		    widthBuffer = Math.abs(sw.lng - ne.lng) * bufferRatio;

		return new EzServerClient.LatLngBounds(
		        new EzServerClient.LatLng(sw.lat - heightBuffer, sw.lng - widthBuffer),
		        new EzServerClient.LatLng(ne.lat + heightBuffer, ne.lng + widthBuffer));
	},

	getCenter: function () { // -> LatLng
		return new EzServerClient.LatLng(
		        (this._southWest.lat + this._northEast.lat) / 2,
		        (this._southWest.lng + this._northEast.lng) / 2);
	},

	getSouthWest: function () {
		return this._southWest;
	},

	getNorthEast: function () {
		return this._northEast;
	},

	getNorthWest: function () {
		return new EzServerClient.LatLng(this.getNorth(), this.getWest());
	},

	getSouthEast: function () {
		return new EzServerClient.LatLng(this.getSouth(), this.getEast());
	},

	getWest: function () {
		return this._southWest.lng;
	},

	getSouth: function () {
		return this._southWest.lat;
	},

	getEast: function () {
		return this._northEast.lng;
	},

	getNorth: function () {
		return this._northEast.lat;
	},

	contains: function (obj) { // (LatLngBounds) or (LatLng) -> Boolean
		if (typeof obj[0] === 'number' || obj instanceof EzServerClient.LatLng) {
			obj = EzServerClient.latLng(obj);
		} else {
			obj = EzServerClient.latLngBounds(obj);
		}

		var sw = this._southWest,
		    ne = this._northEast,
		    sw2, ne2;

		if (obj instanceof EzServerClient.LatLngBounds) {
			sw2 = obj.getSouthWest();
			ne2 = obj.getNorthEast();
		} else {
			sw2 = ne2 = obj;
		}

		return (sw2.lat >= sw.lat) && (ne2.lat <= ne.lat) &&
		       (sw2.lng >= sw.lng) && (ne2.lng <= ne.lng);
	},

	intersects: function (bounds) { // (LatLngBounds)
		bounds = EzServerClient.latLngBounds(bounds);

		var sw = this._southWest,
		    ne = this._northEast,
		    sw2 = bounds.getSouthWest(),
		    ne2 = bounds.getNorthEast(),

		    latIntersects = (ne2.lat >= sw.lat) && (sw2.lat <= ne.lat),
		    lngIntersects = (ne2.lng >= sw.lng) && (sw2.lng <= ne.lng);

		return latIntersects && lngIntersects;
	},

	toBBoxString: function () {
		return [this.getWest(), this.getSouth(), this.getEast(), this.getNorth()].join(',');
	},

	equals: function (bounds) { // (LatLngBounds)
		if (!bounds) { return false; }

		bounds = EzServerClient.latLngBounds(bounds);

		return this._southWest.equals(bounds.getSouthWest()) &&
		       this._northEast.equals(bounds.getNorthEast());
	},

	isValid: function () {
		return !!(this._southWest && this._northEast);
	}
};

//TODO International date line?

EzServerClient.latLngBounds = function (a, b) { // (LatLngBounds) or (LatLng, LatLng)
	if (!a || a instanceof EzServerClient.LatLngBounds) {
		return a;
	}
	return new EzServerClient.LatLngBounds(a, b);
};


/*
 * EzServerClient.Projection contains various geographical projections used by CRS classes.
 */

EzServerClient.Projection = {};


/*
 * Spherical Mercator is the most popular map projection, used by EPSG:3857 CRS used by default.
 */

EzServerClient.Projection.SphericalMercator = {
	MAX_LATITUDE: 85.0511287798,

	project: function (latlng) { // (LatLng) -> Point
		var d = EzServerClient.LatLng.DEG_TO_RAD,
		    max = this.MAX_LATITUDE,
		    lat = Math.max(Math.min(max, latlng.lat), -max),
		    x = latlng.lng * d,
		    y = lat * d;

		y = Math.log(Math.tan((Math.PI / 4) + (y / 2)));

		return new EzServerClient.Point(x, y);
	},

	unproject: function (point) { // (Point, Boolean) -> LatLng
		var d = EzServerClient.LatLng.RAD_TO_DEG,
		    lng = point.x * d,
		    lat = (2 * Math.atan(Math.exp(point.y)) - (Math.PI / 2)) * d;

		return new EzServerClient.LatLng(lat, lng);
	}
};


/*
 * Simple equirectangular (Plate Carree) projection, used by CRS like EPSG:4326 and Simple.
 */

EzServerClient.Projection.LonLat = {
	project: function (latlng) {
		return new EzServerClient.Point(latlng.lng, latlng.lat);
	},

	unproject: function (point) {
		return new EzServerClient.LatLng(point.y, point.x);
	}
};


/*
 * EzServerClient.CRS is a base object for all defined CRS (Coordinate Reference Systems) in Leaflet.
 */

EzServerClient.CRS = {
	latLngToPoint: function (latlng, zoom) { // (LatLng, Number) -> Point
		var projectedPoint = this.projection.project(latlng),
		    scale = this.scale(zoom);

		return this.transformation._transform(projectedPoint, scale);
	},

	pointToLatLng: function (point, zoom) { // (Point, Number[, Boolean]) -> LatLng
		var scale = this.scale(zoom),
		    untransformedPoint = this.transformation.untransform(point, scale);

		return this.projection.unproject(untransformedPoint);
	},

	project: function (latlng) {
		return this.projection.project(latlng);
	},

	scale: function (zoom) {
		//qianleyi Beijing54 -> WGS84
		//return 256 * Math.pow(2, zoom) / ezMap.MapCoordinateType;
		return 256 * Math.pow(2, zoom);
	},

	getSize: function (zoom) {
		var s = this.scale(zoom);
		return EzServerClient.point(s, s);
	}
};


/*
 * A simple CRS that can be used for flat non-Earth maps like panoramas or game maps.
 */

EzServerClient.CRS.Simple = EzServerClient.extend({}, EzServerClient.CRS, {
	projection: EzServerClient.Projection.LonLat,
	transformation: new EzServerClient.Transformation(1, 0, -1, 0),

	scale: function (zoom) {
		return Math.pow(2, zoom);
	}
});


/*
 * EzServerClient.CRS.EPSG3857 (Spherical Mercator) is the most common CRS for web mapping
 * and is used by Leaflet by default.
 */

EzServerClient.CRS.EPSG3857 = EzServerClient.extend({}, EzServerClient.CRS, {
	code: 'EPSG:3857',

	projection: EzServerClient.Projection.SphericalMercator,
	transformation: new EzServerClient.Transformation(0.5 / Math.PI, 0.5, -0.5 / Math.PI, 0.5),

	project: function (latlng) { // (LatLng) -> Point
		var projectedPoint = this.projection.project(latlng),
		    earthRadius = 6378137;
		return projectedPoint.multiplyBy(earthRadius);
	}
});

EzServerClient.CRS.EPSG900913 = EzServerClient.extend({}, EzServerClient.CRS.EPSG3857, {
	code: 'EPSG:900913'
});


/*
 * EzServerClient.CRS.EPSG4326 is a CRS popular among advanced GIS specialists.
 */

EzServerClient.CRS.EPSG4326 = EzServerClient.extend({}, EzServerClient.CRS, {
	code: 'EPSG:4326',

	projection: EzServerClient.Projection.LonLat,
	/**
	 * @author [qianleyi]
	 * @time [2014.7.17]
	 */
	 transformation: new EzServerClient.Transformation(1 / 360, 0.5, -1 / 360, 0.25)
});


/*
 * EzServerClient.CRS.EPSG4326 is a CRS popular among advanced GIS specialists.
 */

EzServerClient.CRS.EPSG4326Ez = EzServerClient.extend({}, EzServerClient.CRS, {
	code: 'EPSG:4326Ez',

	projection: EzServerClient.Projection.LonLat,
	/**
	 * @author [qianleyi]
	 * @time [2014.7.17]
	 */
	// transformation: new EzServerClient.Transformation(1 / 360, 0.5, -1 / 360, 0.5)
	transformation: new EzServerClient.Transformation(1 / 512, 0, 1 / 512, 0)
});


/*
 * EzServerClient.Map is the central class of the API - it is used to create a map.
 */

EzServerClient.Map = EzServerClient.Class.extend({

	includes: EzServerClient.Mixin.Events,

	options: {
		crs: EzServerClient.CRS.EPSG3857,
		/*
		 EzService options
		 */
		ezMapServiceTryTimes: 1,
		/*
		center: LatLng,
		zoom: Number,
		layers: Array,
		*/

		fadeAnimation: EzServerClient.DomUtil.TRANSITION && !EzServerClient.Browser.android23,
		trackResize: true,
		markerZoomAnimation: EzServerClient.DomUtil.TRANSITION && EzServerClient.Browser.any3d
	},

	statics:{
		proxyURL2EzMapService:'http://172.18.69.148:8080/EzProxy6/Proxy?'
	},

	initialize: function (id, options) { // (HTMLElement or String, Object)
		options = EzServerClient.setOptions(this, options);


		this._initContainer(id);
		this._initLayout();

		// hack for https://github.com/Leaflet/Leaflet/issues/1980
		this._onResize = EzServerClient.bind(this._onResize, this);

		this._initEvents();

		if (options.maxBounds) {
			this.setMaxBounds(options.maxBounds);
		}

		if (options.center && options.zoom !== undefined) {
			this.setView(EzServerClient.latLng(options.center), options.zoom, {reset: true});
		}

		this._handlers = [];

		this._layers = {};
		this._zoomBoundLayers = {};
		this._tileLayersNum = 0;

		this.callInitHooks();

		/**
		 * EzMap Service
		 */
		this.queryResults2 = [];

		this._addLayers(options.layers);
	},


	// public methods that modify map state

	// replaced by animation-powered implementation in Map.PanAnimation.js
	setView: function (center, zoom) {
		zoom = zoom === undefined ? this.getZoom() : zoom;
		this._resetView(EzServerClient.latLng(center), this._limitZoom(zoom));
		return this;
	},

	setZoom: function (zoom, options) {
		if (!this._loaded) {
			this._zoom = this._limitZoom(zoom);
			return this;
		}
		return this.setView(this.getCenter(), zoom, {zoom: options});
	},

	zoomIn: function (delta, options) {
		return this.setZoom(this._zoom + (delta || 1), options);
	},

	zoomOut: function (delta, options) {
		return this.setZoom(this._zoom - (delta || 1), options);
	},

	setZoomAround: function (latlng, zoom, options) {
		var scale = this.getZoomScale(zoom),
		    viewHalf = this.getSize().divideBy(2),
		    containerPoint = latlng instanceof EzServerClient.Point ? latlng : this.latLngToContainerPoint(latlng),

		    centerOffset = containerPoint.subtract(viewHalf).multiplyBy(1 - 1 / scale),
		    newCenter = this.containerPointToLatLng(viewHalf.add(centerOffset));

		return this.setView(newCenter, zoom, {zoom: options});
	},

	fitBounds: function (bounds, options) {

		options = options || {};
		bounds = bounds.getBounds ? bounds.getBounds() : EzServerClient.latLngBounds(bounds);

		var paddingTL = EzServerClient.point(options.paddingTopLeft || options.padding || [0, 0]),
		    paddingBR = EzServerClient.point(options.paddingBottomRight || options.padding || [0, 0]),

		    zoom = this.getBoundsZoom(bounds, false, paddingTL.add(paddingBR)),
		    paddingOffset = paddingBR.subtract(paddingTL).divideBy(2),

		    swPoint = this.project(bounds.getSouthWest(), zoom),
		    nePoint = this.project(bounds.getNorthEast(), zoom),
		    center = this.unproject(swPoint.add(nePoint).divideBy(2).add(paddingOffset), zoom);

		zoom = options && options.maxZoom ? Math.min(options.maxZoom, zoom) : zoom;

		return this.setView(center, zoom, options);
	},

	fitWorld: function (options) {
		return this.fitBounds([[-90, -180], [90, 180]], options);
	},

	panTo: function (center, options) { // (LatLng)
		return this.setView(center, this._zoom, {pan: options});
	},

	panBy: function (offset) { // (Point)
		// replaced with animated panBy in Map.PanAnimation.js
		this.fire('movestart');

		this._rawPanBy(EzServerClient.point(offset));

		this.fire('move');
		return this.fire('moveend');
	},

	setMaxBounds: function (bounds) {
		bounds = EzServerClient.latLngBounds(bounds);

		this.options.maxBounds = bounds;

		if (!bounds) {
			return this.off('moveend', this._panInsideMaxBounds, this);
		}

		if (this._loaded) {
			this._panInsideMaxBounds();
		}

		return this.on('moveend', this._panInsideMaxBounds, this);
	},

	panInsideBounds: function (bounds, options) {
		var center = this.getCenter(),
			newCenter = this._limitCenter(center, this._zoom, bounds);

		if (center.equals(newCenter)) { return this; }

		return this.panTo(newCenter, options);
	},

	addLayer: function (layer) {
		// TODO method is too big, refactor

		var id = EzServerClient.stamp(layer);

		if (this._layers[id]) { return this; }

		this._layers[id] = layer;

		// TODO getMaxZoom, getMinZoom in ILayer (instead of options)
		if (layer.options && (!isNaN(layer.options.maxZoom) || !isNaN(layer.options.minZoom))) {
			this._zoomBoundLayers[id] = layer;
			this._updateZoomLevels();
		}

		// TODO looks ugly, refactor!!!
		if (this.options.zoomAnimation && EzServerClient.TileLayer && (layer instanceof EzServerClient.TileLayer)) {
			this._tileLayersNum++;
			this._tileLayersToLoad++;
			layer.on('load', this._onTileLayerLoad, this);
		}

		if (this._loaded) {
			this._layerAdd(layer);
		}

		return this;
	},

	removeLayer: function (layer) {
		var id = EzServerClient.stamp(layer);

		if (!this._layers[id]) { return this; }

		if (this._loaded) {
			layer.onRemove(this);
		}

		delete this._layers[id];

		if (this._loaded) {
			this.fire('layerremove', {layer: layer});
		}

		if (this._zoomBoundLayers[id]) {
			delete this._zoomBoundLayers[id];
			this._updateZoomLevels();
		}

		// TODO looks ugly, refactor
		if (this.options.zoomAnimation && EzServerClient.TileLayer && (layer instanceof EzServerClient.TileLayer)) {
			this._tileLayersNum--;
			this._tileLayersToLoad--;
			layer.off('load', this._onTileLayerLoad, this);
		}

		return this;
	},

	hasLayer: function (layer) {
		if (!layer) { return false; }

		return (EzServerClient.stamp(layer) in this._layers);
	},

	eachLayer: function (method, context) {
		for (var i in this._layers) {
			method.call(context, this._layers[i]);
		}
		return this;
	},

	invalidateSize: function (options) {
		if (!this._loaded) { return this; }

		options = EzServerClient.extend({
			animate: false,
			pan: true
		}, options === true ? {animate: true} : options);

		var oldSize = this.getSize();
		this._sizeChanged = true;
		this._initialCenter = null;

		var newSize = this.getSize(),
		    oldCenter = oldSize.divideBy(2).round(),
		    newCenter = newSize.divideBy(2).round(),
		    offset = oldCenter.subtract(newCenter);

		if (!offset.x && !offset.y) { return this; }

		if (options.animate && options.pan) {
			this.panBy(offset);

		} else {
			if (options.pan) {
				this._rawPanBy(offset);
			}

			this.fire('move');

			if (options.debounceMoveend) {
				clearTimeout(this._sizeTimer);
				this._sizeTimer = setTimeout(EzServerClient.bind(this.fire, this, 'moveend'), 200);
			} else {
				this.fire('moveend');
			}
		}

		return this.fire('resize', {
			oldSize: oldSize,
			newSize: newSize
		});
	},

	// TODO handler.addTo
	addHandler: function (name, HandlerClass) {
		if (!HandlerClass) { return this; }

		var handler = this[name] = new HandlerClass(this);

		this._handlers.push(handler);

		if (this.options[name]) {
			handler.enable();
		}

		return this;
	},

	remove: function () {
		if (this._loaded) {
			this.fire('unload');
		}

		this._initEvents('off');

		try {
			// throws error in IE6-8
			delete this._container._leaflet;
		} catch (e) {
			this._container._leaflet = undefined;
		}

		this._clearPanes();
		if (this._clearControlPos) {
			this._clearControlPos();
		}

		this._clearHandlers();

		return this;
	},


	// public methods for getting map state

	getCenter: function () { // (Boolean) -> LatLng
		this._checkIfLoaded();

		if (this._initialCenter && !this._moved()) {
			return this._initialCenter;
		}
		return this.layerPointToLatLng(this._getCenterLayerPoint());
	},

	getZoom: function () {
		return this._zoom;
	},

	getBounds: function () {
		var bounds = this.getPixelBounds(),
		    sw = this.unproject(bounds.getBottomLeft()),
		    ne = this.unproject(bounds.getTopRight());

		return new EzServerClient.LatLngBounds(sw, ne);
	},

	getMinZoom: function () {
		return this.options.minZoom === undefined ?
			(this._layersMinZoom === undefined ? 0 : this._layersMinZoom) :
			this.options.minZoom;
	},

	getMaxZoom: function () {
		return this.options.maxZoom === undefined ?
			(this._layersMaxZoom === undefined ? Infinity : this._layersMaxZoom) :
			this.options.maxZoom;
	},

	getBoundsZoom: function (bounds, inside, padding) { // (LatLngBounds[, Boolean, Point]) -> Number
		bounds = EzServerClient.latLngBounds(bounds);

		var zoom = this.getMinZoom() - (inside ? 1 : 0),
		    maxZoom = this.getMaxZoom(),
		    size = this.getSize(),

		    nw = bounds.getNorthWest(),
		    se = bounds.getSouthEast(),

		    zoomNotFound = true,
		    boundsSize;

		padding = EzServerClient.point(padding || [0, 0]);

		do {
			zoom++;
			boundsSize = this.project(se, zoom).subtract(this.project(nw, zoom)).add(padding);
			zoomNotFound = !inside ? size.contains(boundsSize) : boundsSize.x < size.x || boundsSize.y < size.y;

		} while (zoomNotFound && zoom <= maxZoom);

		if (zoomNotFound && inside) {
			return null;
		}

		return inside ? zoom : zoom - 1;
	},

	getSize: function () {
		if (!this._size || this._sizeChanged) {
			this._size = new EzServerClient.Point(
				this._container.clientWidth,
				this._container.clientHeight);

			this._sizeChanged = false;
		}
		return this._size.clone();
	},

	getPixelBounds: function () {
		var topLeftPoint = this._getTopLeftPoint();
		/**
		 * @author [qianleyi]
		 * @date [2014.7.18]
		 * @description [鐢变簬EzMapY鍧愭爣鍚戞鍖楋紝鐩存帴add浼氬鑷碋zMap鍧愭爣杈圭晫璁＄畻閿欒]
		 */
		if (this.options.isEzMap) {
			var bottomRightPoint = topLeftPoint.clone();
			bottomRightPoint.x += this.getSize().x;
			bottomRightPoint.y -= this.getSize().y;
			return new EzServerClient.Bounds(topLeftPoint, bottomRightPoint);
		}
		else{
			return new EzServerClient.Bounds(topLeftPoint, topLeftPoint.add(this.getSize()));
		}
	},

	getPixelOrigin: function () {
		this._checkIfLoaded();
		return this._initialTopLeftPoint;
	},

	getPanes: function () {
		return this._panes;
	},

	getContainer: function () {
		return this._container;
	},


	// TODO replace with universal implementation after refactoring projections

	getZoomScale: function (toZoom) {
		var crs = this.options.crs;
		return crs.scale(toZoom) / crs.scale(this._zoom);
	},

	getScaleZoom: function (scale) {
		return this._zoom + (Math.log(scale) / Math.LN2);
	},


	// conversion methods

	project: function (latlng, zoom) { // (LatLng[, Number]) -> Point
		zoom = zoom === undefined ? this._zoom : zoom;
		return this.options.crs.latLngToPoint(EzServerClient.latLng(latlng), zoom);
	},

	unproject: function (point, zoom) { // (Point[, Number]) -> LatLng
		zoom = zoom === undefined ? this._zoom : zoom;
		return this.options.crs.pointToLatLng(EzServerClient.point(point), zoom);
	},

	layerPointToLatLng: function (point) { // (Point)
		if (this.options.isEzMap) {
			/**
		 	* @author qianleyi
			* @description [y杞存柟鍚戝悜涓奭
			*
			*/
			var x = point.x + this.getPixelOrigin().x;
			var y = this.getPixelOrigin().y - point.y;
			var projectedPoint = new EzServerClient.Point(x, y);

			return this.unproject(projectedPoint);
		}
		else{
			var projectedPoint = EzServerClient.point(point).add(this.getPixelOrigin());
			return this.unproject(projectedPoint);
		}	
	},

	latLngToLayerPoint: function (latlng) { // (LatLng)
		var projectedPoint = this.project(EzServerClient.latLng(latlng))._round();
		if (this.options.isEzMap) {
			/**
		 	* @author qianleyi
		 	* @description 鐢变簬鍧愭爣鍘熺偣涓嶅悓锛堟簮浠ｇ爜鍦ㄥ乏涓婅锛孍zServerMap鍦�0,0锛�
		 	*/

			var x = projectedPoint.x - this.getPixelOrigin().x;
			var y = this.getPixelOrigin().y - projectedPoint.y;
			return new EzServerClient.Point(x, y);
		}
		else{
			return projectedPoint._subtract(this.getPixelOrigin());
		}
	},

	containerPointToLayerPoint: function (point) { // (Point)
		return EzServerClient.point(point).subtract(this._getMapPanePos());
	},

	layerPointToContainerPoint: function (point) { // (Point)
		return EzServerClient.point(point).add(this._getMapPanePos());
	},

	containerPointToLatLng: function (point) {
		var layerPoint = this.containerPointToLayerPoint(EzServerClient.point(point));
		return this.layerPointToLatLng(layerPoint);
	},

	latLngToContainerPoint: function (latlng) {
		return this.layerPointToContainerPoint(this.latLngToLayerPoint(EzServerClient.latLng(latlng)));
	},

	mouseEventToContainerPoint: function (e) { // (MouseEvent)
		return EzServerClient.DomEvent.getMousePosition(e, this._container);
	},

	mouseEventToLayerPoint: function (e) { // (MouseEvent)
		return this.containerPointToLayerPoint(this.mouseEventToContainerPoint(e));
	},

	mouseEventToLatLng: function (e) { // (MouseEvent)
		return this.layerPointToLatLng(this.mouseEventToLayerPoint(e));
	},


	// map initialization methods

	_initContainer: function (id) {
		var container = this._container = EzServerClient.DomUtil.get(id);

		if (!container) {
			throw new Error('Map container not found.');
		} else if (container._leaflet) {
			throw new Error('Map container is already initialized.');
		}

		container._leaflet = true;
	},

	_initLayout: function () {
		var container = this._container;

		EzServerClient.DomUtil.addClass(container, 'leaflet-container' +
			(EzServerClient.Browser.touch ? ' leaflet-touch' : '') +
			(EzServerClient.Browser.retina ? ' leaflet-retina' : '') +
			(EzServerClient.Browser.ielt9 ? ' leaflet-oldie' : '') +
			(this.options.fadeAnimation ? ' leaflet-fade-anim' : ''));

		var position = EzServerClient.DomUtil.getStyle(container, 'position');

		if (position !== 'absolute' && position !== 'relative' && position !== 'fixed') {
			container.style.position = 'relative';
		}

		this._initPanes();

		if (this._initControlPos) {
			this._initControlPos();
		}
	},

	_initPanes: function () {
		var panes = this._panes = {};

		this._mapPane = panes.mapPane = this._createPane('leaflet-map-pane', this._container);

		this._tilePane = panes.tilePane = this._createPane('leaflet-tile-pane', this._mapPane);
		panes.objectsPane = this._createPane('leaflet-objects-pane', this._mapPane);
		panes.shadowPane = this._createPane('leaflet-shadow-pane');
		panes.overlayPane = this._createPane('leaflet-overlay-pane');
		panes.markerPane = this._createPane('leaflet-marker-pane');
		panes.popupPane = this._createPane('leaflet-popup-pane');

		var zoomHide = ' leaflet-zoom-hide';

		if (!this.options.markerZoomAnimation) {
			EzServerClient.DomUtil.addClass(panes.markerPane, zoomHide);
			EzServerClient.DomUtil.addClass(panes.shadowPane, zoomHide);
			EzServerClient.DomUtil.addClass(panes.popupPane, zoomHide);
		}
	},

	_createPane: function (className, container) {
		return EzServerClient.DomUtil.create('div', className, container || this._panes.objectsPane);
	},

	_clearPanes: function () {
		this._container.removeChild(this._mapPane);
	},

	_addLayers: function (layers) {
		layers = layers ? (EzServerClient.Util.isArray(layers) ? layers : [layers]) : [];

		for (var i = 0, len = layers.length; i < len; i++) {
			this.addLayer(layers[i]);
		}
	},


	// private methods that modify map state

	_resetView: function (center, zoom, preserveMapOffset, afterZoomAnim) {

		var zoomChanged = (this._zoom !== zoom);

		if (!afterZoomAnim) {
			this.fire('movestart');

			if (zoomChanged) {
				this.fire('zoomstart');
			}
		}

		this._zoom = zoom;
		this._initialCenter = center;

		this._initialTopLeftPoint = this._getNewTopLeftPoint(center);

		if (!preserveMapOffset) {
			EzServerClient.DomUtil.setPosition(this._mapPane, new EzServerClient.Point(0, 0));
		} else {
			if (this.options.isEzMap) {
				/**
			 	* @author [qianleyi]
			 	* @description [淇敼Pan浜嬩欢鍚庣缉鏀句簨浠跺鑷寸殑鍦板浘鍋忕Щ鐜拌薄锛屾娆′慨鏀圭殑BUG鍦∕ap.js鐨刜latLngToNewLayerPoint鍑芥暟涓紙824锛塤BUG淇敼绗簩澶刔
			 	*/
				this._initialTopLeftPoint.x = this._initialTopLeftPoint.x + this._getMapPanePos().x;
				this._initialTopLeftPoint.y = this._initialTopLeftPoint.y - this._getMapPanePos().y;
			}
			else{
				this._initialTopLeftPoint._add(this._getMapPanePos());
			}
		}

		this._tileLayersToLoad = this._tileLayersNum;

		var loading = !this._loaded;
		this._loaded = true;

		this.fire('viewreset', {hard: !preserveMapOffset});

		if (loading) {
			this.fire('load');
			this.eachLayer(this._layerAdd, this);
		}

		this.fire('move');

		if (zoomChanged || afterZoomAnim) {
			this.fire('zoomend');
		}

		this.fire('moveend', {hard: !preserveMapOffset});
	},

	_rawPanBy: function (offset) {
		EzServerClient.DomUtil.setPosition(this._mapPane, this._getMapPanePos().subtract(offset));
	},

	_getZoomSpan: function () {
		return this.getMaxZoom() - this.getMinZoom();
	},

	_updateZoomLevels: function () {
		var i,
			minZoom = Infinity,
			maxZoom = -Infinity,
			oldZoomSpan = this._getZoomSpan();

		for (i in this._zoomBoundLayers) {
			var layer = this._zoomBoundLayers[i];
			if (!isNaN(layer.options.minZoom)) {
				minZoom = Math.min(minZoom, layer.options.minZoom);
			}
			if (!isNaN(layer.options.maxZoom)) {
				maxZoom = Math.max(maxZoom, layer.options.maxZoom);
			}
		}

		if (i === undefined) { // we have no tilelayers
			this._layersMaxZoom = this._layersMinZoom = undefined;
		} else {
			this._layersMaxZoom = maxZoom;
			this._layersMinZoom = minZoom;
		}

		if (oldZoomSpan !== this._getZoomSpan()) {
			this.fire('zoomlevelschange');
		}
	},

	_panInsideMaxBounds: function () {
		this.panInsideBounds(this.options.maxBounds);
	},

	_checkIfLoaded: function () {
		if (!this._loaded) {
			throw new Error('Set map center and zoom first.');
		}
	},

	// map events

	_initEvents: function (onOff) {
		if (!EzServerClient.DomEvent) { return; }

		onOff = onOff || 'on';

		EzServerClient.DomEvent[onOff](this._container, 'click', this._onMouseClick, this);

		var events = ['dblclick', 'mousedown', 'mouseup', 'mouseenter',
		              'mouseleave', 'mousemove', 'contextmenu'],
		    i, len;

		for (i = 0, len = events.length; i < len; i++) {
			EzServerClient.DomEvent[onOff](this._container, events[i], this._fireMouseEvent, this);
		}

		if (this.options.trackResize) {
			EzServerClient.DomEvent[onOff](window, 'resize', this._onResize, this);
		}
	},

	_onResize: function () {
		EzServerClient.Util.cancelAnimFrame(this._resizeRequest);
		this._resizeRequest = EzServerClient.Util.requestAnimFrame(
		        function () { this.invalidateSize({debounceMoveend: true}); }, this, false, this._container);
	},

	_onMouseClick: function (e) {
		if (!this._loaded || (!e._simulated &&
		        ((this.dragging && this.dragging.moved()) ||
		         (this.boxZoom  && this.boxZoom.moved()))) ||
		            EzServerClient.DomEvent._skipped(e)) { return; }

		this.fire('preclick');
		this._fireMouseEvent(e);
	},

	_fireMouseEvent: function (e) {
		if (!this._loaded || EzServerClient.DomEvent._skipped(e)) { return; }

		var type = e.type;

		type = (type === 'mouseenter' ? 'mouseover' : (type === 'mouseleave' ? 'mouseout' : type));

		if (!this.hasEventListeners(type)) { return; }

		if (type === 'contextmenu') {
			EzServerClient.DomEvent.preventDefault(e);
		}

		var containerPoint = this.mouseEventToContainerPoint(e),
		    layerPoint = this.containerPointToLayerPoint(containerPoint),
		    latlng = this.layerPointToLatLng(layerPoint);
		
		//EzServerClient外包类
		//@author qianleyi
		//@date 2014.9.1
		var mapPoint = new EzServerClient.Point(latlng.lng, latlng.lat);

		this.fire(type, {
			latlng: latlng,
			layerPoint: layerPoint,
			containerPoint: containerPoint,
			mapPoint: mapPoint,
			screenPoint: containerPoint,
			originalEvent: e
		});
	},

	_onTileLayerLoad: function () {
		this._tileLayersToLoad--;
		if (this._tileLayersNum && !this._tileLayersToLoad) {
			this.fire('tilelayersload');
		}
	},

	_clearHandlers: function () {
		for (var i = 0, len = this._handlers.length; i < len; i++) {
			this._handlers[i].disable();
		}
	},

	whenReady: function (callback, context) {
		if (this._loaded) {
			callback.call(context || this, this);
		} else {
			this.on('load', callback, context);
		}
		return this;
	},

	_layerAdd: function (layer) {
		layer.onAdd(this);
		this.fire('layeradd', {layer: layer});
	},


	// private methods for getting map state

	_getMapPanePos: function () {
		return EzServerClient.DomUtil.getPosition(this._mapPane);
	},

	_moved: function () {
		var pos = this._getMapPanePos();
		return pos && !pos.equals([0, 0]);
	},

	_getTopLeftPoint: function () {
		if (this.options.isEzMap) {
			var x = this.getPixelOrigin().x - this._getMapPanePos().x;
			var y = this.getPixelOrigin().y + this._getMapPanePos().y;
			return new EzServerClient.Point(x, y);
		}
		else{
			return this.getPixelOrigin().subtract(this._getMapPanePos());
		}
	},

	_getNewTopLeftPoint: function (center, zoom) {
		var viewHalf = this.getSize()._divideBy(2);
		// TODO round on display, not calculation to increase precision?
		/**
		 * @author [qianleyi]
		 * @Date [2014.7.18]
		 * @description [閫氳繃璁剧疆鍙傛暟璁╁叾鍒ゆ柇鏄疎zMap鍦板浘锛屾鏃跺潗鏍嘫杞存槸鍑廬
		 */
		if (this.options.isEzMap) {
			var tempPoint = this.project(center, zoom);
			tempPoint.x -= viewHalf.x;
			tempPoint.y += viewHalf.y;
			tempPoint._round();
			return tempPoint;
		}
		else{
			return this.project(center, zoom)._subtract(viewHalf)._round();
		}
	},

	_latLngToNewLayerPoint: function (latlng, newZoom, newCenter) {
		if (this.options.isEzMap) {
			/**
		 	* @author [qianleyi]
		 	* @description [鍏圥an浜嬩欢鍚巗crollWheel缂╂斁瀵艰嚧鍦板浘涓婁笅鍋忕Щ_BUG淇敼绗竴澶刔
		 	*/
			var topLeft = this._getNewTopLeftPoint(newCenter, newZoom).clone();
			topLeft.x += this._getMapPanePos().x;
			topLeft.y -= this._getMapPanePos().y;

			/**
			 * @author qianleyi
			 * @date 2014.9.9
			 * @description Marker在EzMap坐标下跳动问题
			 */
			var tempPoint = this.project(latlng, newZoom);
			tempPoint.x = tempPoint.x - topLeft.x;
			tempPoint.y = topLeft.y - tempPoint.y;
			return tempPoint;
		}
		else{
			var topLeft = this._getNewTopLeftPoint(newCenter, newZoom).add(this._getMapPanePos());
			
			/**
			 * @author qianleyi
			 * @date 2014.9.9
			 * @description Marker在EzMap坐标下跳动问题
			 */
			return this.project(latlng, newZoom)._subtract(topLeft);
		}
	},

	// layer point of the current center
	_getCenterLayerPoint: function () {
		return this.containerPointToLayerPoint(this.getSize()._divideBy(2));
	},

	// offset of the specified place to the current center in pixels
	_getCenterOffset: function (latlng) {
		return this.latLngToLayerPoint(latlng).subtract(this._getCenterLayerPoint());
	},

	// adjust center for view to get inside bounds
	_limitCenter: function (center, zoom, bounds) {

		if (!bounds) { return center; }

		var centerPoint = this.project(center, zoom),
		    viewHalf = this.getSize().divideBy(2),
		    viewBounds = new EzServerClient.Bounds(centerPoint.subtract(viewHalf), centerPoint.add(viewHalf)),
		    offset = this._getBoundsOffset(viewBounds, bounds, zoom);

		return this.unproject(centerPoint.add(offset), zoom);
	},

	// adjust offset for view to get inside bounds
	_limitOffset: function (offset, bounds) {
		if (!bounds) { return offset; }

		var viewBounds = this.getPixelBounds(),
		    newBounds = new EzServerClient.Bounds(viewBounds.min.add(offset), viewBounds.max.add(offset));

		return offset.add(this._getBoundsOffset(newBounds, bounds));
	},

	// returns offset needed for pxBounds to get inside maxBounds at a specified zoom
	_getBoundsOffset: function (pxBounds, maxBounds, zoom) {
		var nwOffset = this.project(maxBounds.getNorthWest(), zoom).subtract(pxBounds.min),
		    seOffset = this.project(maxBounds.getSouthEast(), zoom).subtract(pxBounds.max),

		    dx = this._rebound(nwOffset.x, -seOffset.x),
		    dy = this._rebound(nwOffset.y, -seOffset.y);

		return new EzServerClient.Point(dx, dy);
	},

	_rebound: function (left, right) {
		return left + right > 0 ?
			Math.round(left - right) / 2 :
			Math.max(0, Math.ceil(left)) - Math.max(0, Math.floor(right));
	},

	_limitZoom: function (zoom) {
		var min = this.getMinZoom(),
		    max = this.getMaxZoom();

		return Math.max(min, Math.min(max, zoom));
	},

	/**
	 * [map description] EzMapSerivce 
	 * @param  {[type]} id       [description]
	 * @param  {[type]} options) {	return     new EzServerClient.Map(id, options [description]
	 * @return {[type]}          [description]
	 */
	setProxyOfEzMapService:function(proxyUrl){
		if (proxyUrl) {
			g_prox_calss = proxyUrl; // 璁剧疆姝ゅ睘鎬т互淇濇寔浠ュ墠鐗堟湰鍏煎鎬э紝
			EzServerClient.Map.proxyURL2EzMapService = proxyUrl;
		}
	}
});

EzServerClient.map = function (id, options) {
	return new EzServerClient.Map(id, options);
};


/*
 * Mercator projection that takes into account that the Earth is not a perfect sphere.
 * Less popular than spherical mercator; used by projections like EPSG:3395.
 */

EzServerClient.Projection.Mercator = {
	MAX_LATITUDE: 85.0840591556,

	R_MINOR: 6356752.314245179,
	R_MAJOR: 6378137,

	project: function (latlng) { // (LatLng) -> Point
		var d = EzServerClient.LatLng.DEG_TO_RAD,
		    max = this.MAX_LATITUDE,
		    lat = Math.max(Math.min(max, latlng.lat), -max),
		    r = this.R_MAJOR,
		    r2 = this.R_MINOR,
		    x = latlng.lng * d * r,
		    y = lat * d,
		    tmp = r2 / r,
		    eccent = Math.sqrt(1.0 - tmp * tmp),
		    con = eccent * Math.sin(y);

		con = Math.pow((1 - con) / (1 + con), eccent * 0.5);

		var ts = Math.tan(0.5 * ((Math.PI * 0.5) - y)) / con;
		y = -r * Math.log(ts);

		return new EzServerClient.Point(x, y);
	},

	unproject: function (point) { // (Point, Boolean) -> LatLng
		var d = EzServerClient.LatLng.RAD_TO_DEG,
		    r = this.R_MAJOR,
		    r2 = this.R_MINOR,
		    lng = point.x * d / r,
		    tmp = r2 / r,
		    eccent = Math.sqrt(1 - (tmp * tmp)),
		    ts = Math.exp(- point.y / r),
		    phi = (Math.PI / 2) - 2 * Math.atan(ts),
		    numIter = 15,
		    tol = 1e-7,
		    i = numIter,
		    dphi = 0.1,
		    con;

		while ((Math.abs(dphi) > tol) && (--i > 0)) {
			con = eccent * Math.sin(phi);
			dphi = (Math.PI / 2) - 2 * Math.atan(ts *
			            Math.pow((1.0 - con) / (1.0 + con), 0.5 * eccent)) - phi;
			phi += dphi;
		}

		return new EzServerClient.LatLng(phi * d, lng);
	}
};



EzServerClient.CRS.EPSG3395 = EzServerClient.extend({}, EzServerClient.CRS, {
	code: 'EPSG:3395',

	projection: EzServerClient.Projection.Mercator,

	transformation: (function () {
		var m = EzServerClient.Projection.Mercator,
		    r = m.R_MAJOR,
		    scale = 0.5 / (Math.PI * r);

		return new EzServerClient.Transformation(scale, 0.5, -scale, 0.5);
	}())
});


/*
 * EzServerClient.TileLayer is used for standard xyz-numbered tile layers.
 */

EzServerClient.TileLayer = EzServerClient.Class.extend({
	includes: EzServerClient.Mixin.Events,

	options: {
		minZoom: 0,
		maxZoom: 18,
		tileSize: 256,
		subdomains: 'abc',
		errorTileUrl: '',
		attribution: '',
		zoomOffset: 0,
		opacity: 1,
		/*
		maxNativeZoom: null,
		zIndex: null,
		tms: false,
		continuousWorld: false,
		noWrap: false,
		zoomReverse: false,
		detectRetina: false,
		reuseTiles: false,
		bounds: false,
		*/
		unloadInvisibleTiles: EzServerClient.Browser.mobile,
		updateWhenIdle: EzServerClient.Browser.mobile
	},

	initialize: function (url, options) {
		options = EzServerClient.setOptions(this, options);

		// detecting retina displays, adjusting tileSize and zoom levels
		if (options.detectRetina && EzServerClient.Browser.retina && options.maxZoom > 0) {

			options.tileSize = Math.floor(options.tileSize / 2);
			options.zoomOffset++;

			if (options.minZoom > 0) {
				options.minZoom--;
			}
			this.options.maxZoom--;
		}

		if (options.bounds) {
			options.bounds = EzServerClient.latLngBounds(options.bounds);
		}

		this._url = url;

		var subdomains = this.options.subdomains;

		if (typeof subdomains === 'string') {
			this.options.subdomains = subdomains.split('');
		}
	},

	onAdd: function (map) {
		this._map = map;
		this._animated = map._zoomAnimated;

		// create a container div for tiles
		this._initContainer();

		// set up events
		map.on({
			'viewreset': this._reset,
			'moveend': this._update
		}, this);

		if (this._animated) {
			map.on({
				'zoomanim': this._animateZoom,
				'zoomend': this._endZoomAnim
			}, this);
		}

		if (!this.options.updateWhenIdle) {
			this._limitedUpdate = EzServerClient.Util.limitExecByInterval(this._update, 150, this);
			map.on('move', this._limitedUpdate, this);
		}

		this._reset();
		this._update();
	},

	addTo: function (map) {
		map.addLayer(this);
		return this;
	},

	onRemove: function (map) {
		this._container.parentNode.removeChild(this._container);

		map.off({
			'viewreset': this._reset,
			'moveend': this._update
		}, this);

		if (this._animated) {
			map.off({
				'zoomanim': this._animateZoom,
				'zoomend': this._endZoomAnim
			}, this);
		}

		if (!this.options.updateWhenIdle) {
			map.off('move', this._limitedUpdate, this);
		}

		this._container = null;
		this._map = null;
	},

	bringToFront: function () {
		var pane = this._map._panes.tilePane;

		if (this._container) {
			pane.appendChild(this._container);
			this._setAutoZIndex(pane, Math.max);
		}

		return this;
	},

	bringToBack: function () {
		var pane = this._map._panes.tilePane;

		if (this._container) {
			pane.insertBefore(this._container, pane.firstChild);
			this._setAutoZIndex(pane, Math.min);
		}

		return this;
	},

	getAttribution: function () {
		return this.options.attribution;
	},

	getContainer: function () {
		return this._container;
	},

	setOpacity: function (opacity) {
		this.options.opacity = opacity;

		if (this._map) {
			this._updateOpacity();
		}

		return this;
	},

	setZIndex: function (zIndex) {
		this.options.zIndex = zIndex;
		this._updateZIndex();

		return this;
	},

	setUrl: function (url, noRedraw) {
		this._url = url;

		if (!noRedraw) {
			this.redraw();
		}

		return this;
	},

	redraw: function () {
		if (this._map) {
			this._reset({hard: true});
			this._update();
		}
		return this;
	},

	_updateZIndex: function () {
		if (this._container && this.options.zIndex !== undefined) {
			this._container.style.zIndex = this.options.zIndex;
		}
	},

	_setAutoZIndex: function (pane, compare) {

		var layers = pane.children,
		    edgeZIndex = -compare(Infinity, -Infinity), // -Infinity for max, Infinity for min
		    zIndex, i, len;

		for (i = 0, len = layers.length; i < len; i++) {

			if (layers[i] !== this._container) {
				zIndex = parseInt(layers[i].style.zIndex, 10);

				if (!isNaN(zIndex)) {
					edgeZIndex = compare(edgeZIndex, zIndex);
				}
			}
		}

		this.options.zIndex = this._container.style.zIndex =
		        (isFinite(edgeZIndex) ? edgeZIndex : 0) + compare(1, -1);
	},

	_updateOpacity: function () {
		var i,
		    tiles = this._tiles;

		if (EzServerClient.Browser.ielt9) {
			for (i in tiles) {
				EzServerClient.DomUtil.setOpacity(tiles[i], this.options.opacity);
			}
		} else {
			EzServerClient.DomUtil.setOpacity(this._container, this.options.opacity);
		}
	},

	_initContainer: function () {
		var tilePane = this._map._panes.tilePane;

		if (!this._container) {
			this._container = EzServerClient.DomUtil.create('div', 'leaflet-layer');

			this._updateZIndex();

			if (this._animated) {
				var className = 'leaflet-tile-container';

				this._bgBuffer = EzServerClient.DomUtil.create('div', className, this._container);
				this._tileContainer = EzServerClient.DomUtil.create('div', className, this._container);

			} else {
				this._tileContainer = this._container;
			}

			tilePane.appendChild(this._container);

			if (this.options.opacity < 1) {
				this._updateOpacity();
			}
		}
	},

	_reset: function (e) {
		for (var key in this._tiles) {
			this.fire('tileunload', {tile: this._tiles[key]});
		}

		this._tiles = {};
		this._tilesToLoad = 0;

		if (this.options.reuseTiles) {
			this._unusedTiles = [];
		}

		this._tileContainer.innerHTML = '';

		if (this._animated && e && e.hard) {
			this._clearBgBuffer();
		}

		this._initContainer();
	},

	_getTileSize: function () {
		var map = this._map,
		    zoom = map.getZoom() + this.options.zoomOffset,
		    zoomN = this.options.maxNativeZoom,
		    tileSize = this.options.tileSize;

		if (zoomN && zoom > zoomN) {
			tileSize = Math.round(map.getZoomScale(zoom) / map.getZoomScale(zoomN) * tileSize);
		}

		return tileSize;
	},

	_update: function () {

		if (!this._map) { return; }

		var map = this._map,
		    bounds = map.getPixelBounds(),
		    zoom = map.getZoom(),
		    tileSize = this._getTileSize();

		if (zoom > this.options.maxZoom || zoom < this.options.minZoom) {
			return;
		}

		var tileBounds = EzServerClient.bounds(
		        bounds.min.divideBy(tileSize)._floor(),
		        bounds.max.divideBy(tileSize)._floor());

		this._addTilesFromCenterOut(tileBounds);

		if (this.options.unloadInvisibleTiles || this.options.reuseTiles) {
			this._removeOtherTiles(tileBounds);
		}
	},

	_addTilesFromCenterOut: function (bounds) {
		var queue = [],
		    center = bounds.getCenter();

		var j, i, point;

		for (j = bounds.min.y; j <= bounds.max.y; j++) {
			for (i = bounds.min.x; i <= bounds.max.x; i++) {
				point = new EzServerClient.Point(i, j);

				//qianleyi Beijing54
				if (this._tileShouldBeLoaded(point)) {
					queue.push(point);
				}
			}
		}

		var tilesToLoad = queue.length;

		if (tilesToLoad === 0) { return; }

		// load tiles in order of their distance to center
		queue.sort(function (a, b) {
			return a.distanceTo(center) - b.distanceTo(center);
		});

		var fragment = document.createDocumentFragment();

		// if its the first batch of tiles to load
		if (!this._tilesToLoad) {
			this.fire('loading');
		}

		this._tilesToLoad += tilesToLoad;

		for (i = 0; i < tilesToLoad; i++) {
			this._addTile(queue[i], fragment);
		}

		this._tileContainer.appendChild(fragment);
	},

	_tileShouldBeLoaded: function (tilePoint) {
		if ((tilePoint.x + ':' + tilePoint.y) in this._tiles) {
			return false; // already loaded
		}

		var options = this.options;

		/*if (!options.continuousWorld && (ezMap.MapCoordinateType === 1)) {
			var limit = this._getWrapTileNum();

			// don't load if exceeds world bounds
			if (this._map.options.isEzMap) {
				if ((options.noWrap && (tilePoint.x >= limit.x)) ||
				 tilePoint.y >= limit.y) { return false; }
			}
			else{
				if ((options.noWrap && (tilePoint.x < 0 || tilePoint.x >= limit.x)) ||
				tilePoint.y < 0 || tilePoint.y >= limit.y) { return false; }
			}
		}*/

		var limit = this._getWrapTileNum();

		// don't load if exceeds world bounds
		if (this._map.options.isEzMap) {
			if ((options.noWrap && (tilePoint.x >= limit.x)) ||
			 tilePoint.y >= limit.y) { return false; }
		}
		else{
			if ((options.noWrap && (tilePoint.x < 0 || tilePoint.x >= limit.x)) ||
			tilePoint.y < 0 || tilePoint.y >= limit.y) { return false; }
		}

		if (options.bounds) {
			var tileSize = options.tileSize,
			    nwPoint = tilePoint.multiplyBy(tileSize),
			    sePoint = nwPoint.add([tileSize, tileSize]),
			    nw = this._map.unproject(nwPoint),
			    se = this._map.unproject(sePoint);

			// TODO temporary hack, will be removed after refactoring projections
			// https://github.com/Leaflet/Leaflet/issues/1618
			if (!options.continuousWorld && !options.noWrap) {
				nw = nw.wrap();
				se = se.wrap();
			}

			if (!options.bounds.intersects([nw, se])) { return false; }
		}

		return true;
	},

	_removeOtherTiles: function (bounds) {
		var kArr, x, y, key;

		for (key in this._tiles) {
			kArr = key.split(':');
			x = parseInt(kArr[0], 10);
			y = parseInt(kArr[1], 10);

			// remove tile if it's out of bounds
			if (x < bounds.min.x || x > bounds.max.x || y < bounds.min.y || y > bounds.max.y) {
				this._removeTile(key);
			}
		}
	},

	_removeTile: function (key) {
		var tile = this._tiles[key];

		this.fire('tileunload', {tile: tile, url: tile.src});

		if (this.options.reuseTiles) {
			EzServerClient.DomUtil.removeClass(tile, 'leaflet-tile-loaded');
			this._unusedTiles.push(tile);

		} else if (tile.parentNode === this._tileContainer) {
			this._tileContainer.removeChild(tile);
		}

		// for https://github.com/CloudMade/Leaflet/issues/137
		if (!EzServerClient.Browser.android) {
			tile.onload = null;
			tile.src = EzServerClient.Util.emptyImageUrl;
		}

		delete this._tiles[key];
	},

	_addTile: function (tilePoint, container) {
		var tilePos = this._getTilePos(tilePoint);

		// get unused tile - or create a new tile
		var tile = this._getTile();

		/*
		Chrome 20 layouts much faster with top/left (verify with timeline, frames)
		Android 4 browser has display issues with top/left and requires transform instead
		(other browsers don't currently care) - see debug/hacks/jitter.html for an example
		*/
		EzServerClient.DomUtil.setPosition(tile, tilePos, EzServerClient.Browser.chrome);

		this._tiles[tilePoint.x + ':' + tilePoint.y] = tile;

		this._loadTile(tile, tilePoint);

		if (tile.parentNode !== this._tileContainer) {
			container.appendChild(tile);
		}
	},

	_getZoomForUrl: function () {

		var options = this.options,
		    zoom = this._map.getZoom();

		if (options.zoomReverse) {
			zoom = options.maxZoom - zoom;
		}

		zoom += options.zoomOffset;

		return options.maxNativeZoom ? Math.min(zoom, options.maxNativeZoom) : zoom;
	},

	_getTilePos: function (tilePoint) {
		var origin = this._map.getPixelOrigin(),
		    tileSize = this._getTileSize();

		/**
		 * @author [qianleyi]
		 */
		if(this._map.options.isEzMap){
			var x = tilePoint.multiplyBy(tileSize).x - origin.x;
			var y = origin.y - tilePoint.multiplyBy(tileSize).y - 256;
			return new EzServerClient.Point(x, y);
		}
		else{
			return tilePoint.multiplyBy(tileSize).subtract(origin);
		}
	},

	// image-specific code (override to implement e.g. Canvas or SVG tile layer)

	getTileUrl: function (tilePoint) {
		return EzServerClient.Util.template(this._url, EzServerClient.extend({
			s: this._getSubdomain(tilePoint),
			z: tilePoint.z,
			x: tilePoint.x,
			y: tilePoint.y
		}, this.options));
	},

	_getWrapTileNum: function () {
		var crs = this._map.options.crs,
		    size = crs.getSize(this._map.getZoom());
		return size.divideBy(this._getTileSize())._floor();
	},

	_adjustTilePoint: function (tilePoint) {

		var limit = this._getWrapTileNum();

		// wrap tile coordinates
		if (!this.options.continuousWorld && !this.options.noWrap) {
			/**
			 * @author [qianleyi]
			 * @date [2014.7.18]
			 * @description [EzMap：x为负值时，部分瓦片不显示问题]
			 */
			if (!this._map.options.isEzMap) {
				tilePoint.x = ((tilePoint.x % limit.x) + limit.x) % limit.x;
			}

			//tilePoint.x = ((tilePoint.x % limit.x) + limit.x) % limit.x;
		}

		if (this.options.tms) {
			tilePoint.y = limit.y - tilePoint.y - 1;
		}

		tilePoint.z = this._getZoomForUrl();
	},

	_getSubdomain: function (tilePoint) {
		var index = Math.abs(tilePoint.x + tilePoint.y) % this.options.subdomains.length;
		return this.options.subdomains[index];
	},

	_getTile: function () {
		if (this.options.reuseTiles && this._unusedTiles.length > 0) {
			var tile = this._unusedTiles.pop();
			this._resetTile(tile);
			return tile;
		}
		return this._createTile();
	},

	// Override if data stored on a tile needs to be cleaned up before reuse
	_resetTile: function (/*tile*/) {},

	_createTile: function () {
		var tile = EzServerClient.DomUtil.create('img', 'leaflet-tile');
		tile.style.width = tile.style.height = this._getTileSize() + 'px';
		tile.galleryimg = 'no';

		tile.onselectstart = tile.onmousemove = EzServerClient.Util.falseFn;

		if (EzServerClient.Browser.ielt9 && this.options.opacity !== undefined) {
			EzServerClient.DomUtil.setOpacity(tile, this.options.opacity);
		}
		// without this hack, tiles disappear after zoom on Chrome for Android
		// https://github.com/Leaflet/Leaflet/issues/2078
		if (EzServerClient.Browser.mobileWebkit3d) {
			tile.style.WebkitBackfaceVisibility = 'hidden';
		}
		return tile;
	},

	_loadTile: function (tile, tilePoint) {
		tile._layer  = this;
		tile.onload  = this._tileOnLoad;
		tile.onerror = this._tileOnError;

		this._adjustTilePoint(tilePoint);
		tile.src     = this.getTileUrl(tilePoint);

		this.fire('tileloadstart', {
			tile: tile,
			url: tile.src
		});
	},

	_tileLoaded: function () {
		this._tilesToLoad--;

		if (this._animated) {
			EzServerClient.DomUtil.addClass(this._tileContainer, 'leaflet-zoom-animated');
		}

		if (!this._tilesToLoad) {
			this.fire('load');

			if (this._animated) {
				// clear scaled tiles after all new tiles are loaded (for performance)
				clearTimeout(this._clearBgBufferTimer);
				this._clearBgBufferTimer = setTimeout(EzServerClient.bind(this._clearBgBuffer, this), 500);
			}
		}
	},

	_tileOnLoad: function () {
		var layer = this._layer;

		//Only if we are loading an actual image
		if (this.src !== EzServerClient.Util.emptyImageUrl) {
			EzServerClient.DomUtil.addClass(this, 'leaflet-tile-loaded');

			layer.fire('tileload', {
				tile: this,
				url: this.src
			});
		}

		layer._tileLoaded();
	},

	_tileOnError: function () {
		var layer = this._layer;

		layer.fire('tileerror', {
			tile: this,
			url: this.src
		});

		var newUrl = layer.options.errorTileUrl;
		if (newUrl) {
			this.src = newUrl;
		}

		layer._tileLoaded();
	},

	/**
	 * [tileLayer description]
	 * @param  {[type]} url      [description]
	 * @param  {[type]} options) {	return     new EzServerClient.TileLayer(url, options [description]
	 * @return {[type]}          [description]
	 * @author [qianleyi]
	 */
	clone:function(){
		return new EzServerClient.TileLayer(this._url,this.options);
	}
});

EzServerClient.tileLayer = function (url, options) {
	return new EzServerClient.TileLayer(url, options);
};


/*
 * EzServerClient.TileLayer.WMS is used for putting WMS tile layers on the map.
 */

EzServerClient.TileLayer.WMS = EzServerClient.TileLayer.extend({

	defaultWmsParams: {
		service: 'WMS',
		request: 'GetMap',
		version: '1.1.1',
		layers: '',
		styles: '',
		format: 'image/jpeg',
		transparent: false
	},

	initialize: function (url, options) { // (String, Object)

		this._url = url;

		var wmsParams = EzServerClient.extend({}, this.defaultWmsParams),
		    tileSize = options.tileSize || this.options.tileSize;

		if (options.detectRetina && EzServerClient.Browser.retina) {
			wmsParams.width = wmsParams.height = tileSize * 2;
		} else {
			wmsParams.width = wmsParams.height = tileSize;
		}

		for (var i in options) {
			// all keys that are not TileLayer options go to WMS params
			if (!this.options.hasOwnProperty(i) && i !== 'crs') {
				wmsParams[i] = options[i];
			}
		}

		this.wmsParams = wmsParams;

		EzServerClient.setOptions(this, options);
	},

	onAdd: function (map) {

		this._crs = this.options.crs || map.options.crs;

		this._wmsVersion = parseFloat(this.wmsParams.version);

		var projectionKey = this._wmsVersion >= 1.3 ? 'crs' : 'srs';
		this.wmsParams[projectionKey] = this._crs.code;

		EzServerClient.TileLayer.prototype.onAdd.call(this, map);
	},

	getTileUrl: function (tilePoint) { // (Point, Number) -> String

		var map = this._map,
		    tileSize = this.options.tileSize,

		    nwPoint = tilePoint.multiplyBy(tileSize),
		    sePoint = nwPoint.add([tileSize, tileSize]),

		    nw = this._crs.project(map.unproject(nwPoint, tilePoint.z)),
		    se = this._crs.project(map.unproject(sePoint, tilePoint.z)),
		    bbox = this._wmsVersion >= 1.3 && this._crs === EzServerClient.CRS.EPSG4326 ?
		        [se.y, nw.x, nw.y, se.x].join(',') :
		        [nw.x, se.y, se.x, nw.y].join(','),

		    url = EzServerClient.Util.template(this._url, {s: this._getSubdomain(tilePoint)});

		return url + EzServerClient.Util.getParamString(this.wmsParams, url, true) + '&BBOX=' + bbox;
	},

	setParams: function (params, noRedraw) {

		EzServerClient.extend(this.wmsParams, params);

		if (!noRedraw) {
			this.redraw();
		}

		return this;
	}
});

EzServerClient.tileLayer.wms = function (url, options) {
	return new EzServerClient.TileLayer.WMS(url, options);
};


/*
 * EzServerClient.TileLayer.EzMap is used for load the EzServer map.
 * @author [qianleyi]
 * @date [2014.7.18]
 */

EzServerClient.TileLayer.EzMap = EzServerClient.TileLayer.extend({

	options: {
		isEzMap: true,
		noWrap: true
		// minZoom: 0,
		// maxZoom: 18,
		// tileSize: 256,
		// subdomains: 'abc',
		// errorTileUrl: '',
		// attribution: '',
		// zoomOffset: 0,
		// opacity: 1,
		/*
		maxNativeZoom: null,
		zIndex: null,
		tms: false,
		continuousWorld: false,
		noWrap: false,
		zoomReverse: false,
		detectRetina: false,
		reuseTiles: false,
		bounds: false,
		*/
		// unloadInvisibleTiles: EzServerClient.Browser.mobile,
		// updateWhenIdle: EzServerClient.Browser.mobile
	},

	_adjustTilePoint: function (tilePoint) {

		var limit = this._getWrapTileNum();

		// wrap tile coordinates
		if (!this.options.continuousWorld && !this.options.noWrap) {
			/**
			 * @author [qianleyi]
			 * @date [2014.7.18]
			 * @description [EzMap：x为负值时，部分瓦片不显示问题]
			 */
			if (tilePoint.x > 0) {
				tilePoint.x = ((tilePoint.x % limit.x) + limit.x) % limit.x;
			}
		}

		if (this.options.tms) {
			tilePoint.y = limit.y - tilePoint.y - 1;
		}

		tilePoint.z = this._getZoomForUrl();
	},

	_getTilePos: function (tilePoint) {
		var origin = this._map.getPixelOrigin(),
		    tileSize = this._getTileSize();

		var x = tilePoint.multiplyBy(tileSize).x - origin.x;
		var y = origin.y - tilePoint.multiplyBy(tileSize).y - 256;
		return new EzServerClient.Point(x, y);
	},

	_tileShouldBeLoaded: function (tilePoint) {
		if ((tilePoint.x + ':' + tilePoint.y) in this._tiles) {
			return false; // already loaded
		}

		var options = this.options;

		//qianleyi Beijing54
		//if (!options.continuousWorld && (ezMap.MapCoordinateType === 1)) {
		if (!options.continuousWorld) {
			var limit = this._getWrapTileNum();

			// don't load if exceeds world bounds
			// if ((options.noWrap && (tilePoint.x < 0 || tilePoint.x >= limit.x)) ||
			// 	tilePoint.y < 0 || tilePoint.y >= limit.y) { return false; }
			/**
			 * @author qianleyi
			 * 修改出现负值行列号报错情况（瓦片不显示）
			 */
			if ((options.noWrap && (tilePoint.x >= limit.x)) ||
				 tilePoint.y >= limit.y) { return false; }
		}

		if (options.bounds) {
			var tileSize = options.tileSize,
			    nwPoint = tilePoint.multiplyBy(tileSize),
			    sePoint = nwPoint.add([tileSize, tileSize]),
			    nw = this._map.unproject(nwPoint),
			    se = this._map.unproject(sePoint);

			// TODO temporary hack, will be removed after refactoring projections
			// https://github.com/Leaflet/Leaflet/issues/1618
			if (!options.continuousWorld && !options.noWrap) {
				nw = nw.wrap();
				se = se.wrap();
			}

			if (!options.bounds.intersects([nw, se])) { return false; }
		}

		return true;
	}

});

EzServerClient.tileLayer.EzMap = function(url, options) {
	return new EzServerClient.TileLayer.EzMap(url, options);
};

/*
 * EzServerClient.TileLayer.Canvas is a class that you can use as a base for creating
 * dynamically drawn Canvas-based tile layers.
 */

EzServerClient.TileLayer.Canvas = EzServerClient.TileLayer.extend({
	options: {
		async: false
	},

	initialize: function (options) {
		EzServerClient.setOptions(this, options); 
	},

	redraw: function () {
		if (this._map) {
			this._reset({hard: true});
			this._update();
		}

		for (var i in this._tiles) {
			this._redrawTile(this._tiles[i]);
		}
		return this;
	},

	_redrawTile: function (tile) {
		this.drawTile(tile, tile._tilePoint, this._map._zoom);
	},

	_createTile: function () {
		var tile = EzServerClient.DomUtil.create('canvas', 'leaflet-tile');
		tile.width = tile.height = this.options.tileSize;
		tile.onselectstart = tile.onmousemove = EzServerClient.Util.falseFn;
		return tile;
	},

	_loadTile: function (tile, tilePoint) {
		tile._layer = this;
		tile._tilePoint = tilePoint;

		this._redrawTile(tile);

		if (!this.options.async) {
			this.tileDrawn(tile);
		}
	},

	drawTile: function (/*tile, tilePoint*/) {
		// override with rendering code
	},

	tileDrawn: function (tile) {
		this._tileOnLoad.call(tile);
	}
});


EzServerClient.tileLayer.canvas = function (options) {
	return new EzServerClient.TileLayer.Canvas(options);
};




EzServerClient.TileLayer.HotSpot = EzServerClient.TileLayer.extend({
	includes: EzServerClient.Mixin.Events,

	options: {
		hot:'hot/z{z}/x{x}/z{z}_x{x}_y{y}',
		tile:'tile/z{z}/x{x}/z{z}_x{x}_y{y}',
		icon:null,
		minZoom: 0,
		maxZoom: 18,
		tileSize: 256,
		subdomains: 'abc',
		errorTileUrl: '',
		attribution: '',
		zoomOffset: 0,
		opacity: 1,
		/*
		maxNativeZoom: null,
		zIndex: null,
		tms: false,
		continuousWorld: false,
		noWrap: false,
		zoomReverse: false,
		detectRetina: false,
		reuseTiles: false,
		bounds: false,
		*/
		unloadInvisibleTiles: EzServerClient.Browser.mobile,
		updateWhenIdle: EzServerClient.Browser.mobile
	},

	initialize: function (url, options,hotcallback) {
		options = EzServerClient.setOptions(this, options);

		// detecting retina displays, adjusting tileSize and zoom levels
		if (options.detectRetina && EzServerClient.Browser.retina && options.maxZoom > 0) {

			options.tileSize = Math.floor(options.tileSize / 2);
			options.zoomOffset++;

			if (options.minZoom > 0) {
				options.minZoom--;
			}
			this.options.maxZoom--;
		}

		if (options.bounds) {
			options.bounds = EzServerClient.latLngBounds(options.bounds);
		}
		
		this._hoturl = url + this.options.hot;

		this._url = url + this.options.tile;
		
		this._hotcallback = hotcallback;

		var subdomains = this.options.subdomains;

		if (typeof subdomains === 'string') {
			this.options.subdomains = subdomains.split('');
		}
	},

	onAdd: function (map) {
		this._map = map;
		this._animated = map._zoomAnimated;

		// create a container div for tiles
		this._initContainer();

		// set up events
		map.on({
			'viewreset': this._reset,
			'moveend': this._update
		}, this);

		if (this._animated) {
			map.on({
				'zoomanim': this._animateZoom,
				'zoomend': this._endZoomAnim
			}, this);
		}

		if (!this.options.updateWhenIdle) {
			this._limitedUpdate = EzServerClient.Util.limitExecByInterval(this._update, 150, this);
			map.on('move', this._limitedUpdate, this);
		}
		
		map.on('mousemove',this._addHotSpot,this);
		
		this._marker = EzServerClient.marker([0,0],{
			icon: this.options.icon
		}).addTo(this._map);
		this._marker.setOpacity(0);
		
		//this._map.popupmarker = null;
		
		this._marker.on('mouseout',function(){
			this.setOpacity(0);
		});
		
		this._marker.on('popupopen',function(){
			this._map.popupmarker = EzServerClient.marker(this._latlng,this.options).addTo(this._map);
		});
		
		this._marker.on('popupclose',function(){
			this._map.removeLayer(this._map.popupmarker);
		});
		

		this._reset();
		this._update();
	},

	addTo: function (map) {
		map.addLayer(this);
		return this;
	},

	_getMouseToTopLeftBounds:function(latlng,map){
		var topLeftPoint = map._getTopLeftPoint();

		var bottomRightPoint = map.project(latlng,map.getZoom());
		return new EzServerClient.Bounds(topLeftPoint,bottomRightPoint);
	},
	
	_addHotSpot:function(e){
		var mousebounds = this._getMouseToTopLeftBounds(e.latlng,this._map);
		var containerPoint = e.layerPoint,
			tileSize = this._getTileSize();
		
		var mousetileBounds = EzServerClient.bounds(
				mousebounds.min.divideBy(tileSize)._floor(),
				mousebounds.max.divideBy(tileSize)._floor());
		
		
		if(this._map.options.isEzMap){
			//EzMap 
			var tileID = mousetileBounds.max.x + ':' + mousetileBounds.min.y;
		}
		else{
			//TiDiTu
			var tileID = mousetileBounds.max.x + ':' + mousetileBounds.max.y;
		}
		
		
		if(tileID in this._map._hotspotareas){
			var hotspotArr = this._map._hotspotareas[tileID],
				len = hotspotArr.length;
			for(var i = 0; i < len; i++){
				var hotspotlatlng = EzServerClient.latLng(hotspotArr[i].Y, hotspotArr[i].X),
					hotspotlayerpoint = this._map.latLngToLayerPoint(hotspotlatlng),
					hotspotBounds = EzServerClient.bounds(new Point(hotspotlayerpoint.x-6,hotspotlayerpoint.y-6),new Point(hotspotlayerpoint.x+6,hotspotlayerpoint.y+6));
				
				var data = {
						'ID': hotspotArr[i].ID,
						'LABEL' : hotspotArr[i].LABEL,
						'X': hotspotArr[i].X,
						'Y': hotspotArr[i].Y
				};
				
				if(hotspotBounds.contains(containerPoint)){
					this._marker.setLatLng(hotspotlatlng);
					this._marker._icon.title = hotspotArr[i].LABEL;
					this._marker.setOpacity(1);
					this._marker.bindPopup(this._hotcallback(data));
					break;
				}
			}
		}
	},

	onRemove: function (map) {
		this._container.parentNode.removeChild(this._container);

		map.off({
			'viewreset': this._reset,
			'moveend': this._update
		}, this);

		if (this._animated) {
			map.off({
				'zoomanim': this._animateZoom,
				'zoomend': this._endZoomAnim
			}, this);
		}

		if (!this.options.updateWhenIdle) {
			map.off('move', this._limitedUpdate, this);
		}

		this._container = null;
		this._map = null;
	},

	bringToFront: function () {
		var pane = this._map._panes.tilePane;

		if (this._container) {
			pane.appendChild(this._container);
			this._setAutoZIndex(pane, Math.max);
		}

		return this;
	},

	bringToBack: function () {
		var pane = this._map._panes.tilePane;

		if (this._container) {
			pane.insertBefore(this._container, pane.firstChild);
			this._setAutoZIndex(pane, Math.min);
		}

		return this;
	},

	getAttribution: function () {
		return this.options.attribution;
	},

	getContainer: function () {
		return this._container;
	},

	setOpacity: function (opacity) {
		this.options.opacity = opacity;

		if (this._map) {
			this._updateOpacity();
		}

		return this;
	},

	setZIndex: function (zIndex) {
		this.options.zIndex = zIndex;
		this._updateZIndex();

		return this;
	},

	setUrl: function (url, noRedraw) {
		this._url = url;

		if (!noRedraw) {
			this.redraw();
		}

		return this;
	},

	redraw: function () {
		if (this._map) {
			this._reset({hard: true});
			this._update();
		}
		return this;
	},

	_updateZIndex: function () {
		if (this._container && this.options.zIndex !== undefined) {
			this._container.style.zIndex = this.options.zIndex;
		}
	},

	_setAutoZIndex: function (pane, compare) {

		var layers = pane.children,
		    edgeZIndex = -compare(Infinity, -Infinity), // -Infinity for max, Infinity for min
		    zIndex, i, len;

		for (i = 0, len = layers.length; i < len; i++) {

			if (layers[i] !== this._container) {
				zIndex = parseInt(layers[i].style.zIndex, 10);

				if (!isNaN(zIndex)) {
					edgeZIndex = compare(edgeZIndex, zIndex);
				}
			}
		}

		this.options.zIndex = this._container.style.zIndex =
		        (isFinite(edgeZIndex) ? edgeZIndex : 0) + compare(1, -1);
	},

	_updateOpacity: function () {
		var i,
		    tiles = this._tiles;

		if (EzServerClient.Browser.ielt9) {
			for (i in tiles) {
				EzServerClient.DomUtil.setOpacity(tiles[i], this.options.opacity);
			}
		} else {
			EzServerClient.DomUtil.setOpacity(this._container, this.options.opacity);
		}
	},

	_initContainer: function () {
		var tilePane = this._map._panes.overlayPane;

		if (!this._container) {
			this._container = EzServerClient.DomUtil.create('div', 'leaflet-layer');

			this._updateZIndex();

			if (this._animated) {
				var className = 'leaflet-tile-container';

				this._bgBuffer = EzServerClient.DomUtil.create('div', className, this._container);
				this._tileContainer = EzServerClient.DomUtil.create('div', className, this._container);

			} else {
				this._tileContainer = this._container;
			}

			tilePane.appendChild(this._container);

			if (this.options.opacity < 1) {
				this._updateOpacity();
			}
		}
	},

	_reset: function (e) {
		for (var key in this._tiles) {
			this.fire('tileunload', {tile: this._tiles[key]});
		}

		this._tiles = {};
		this._map._hotspotareas = {};
		
		this._tilesToLoad = 0;

		if (this.options.reuseTiles) {
			this._unusedTiles = [];
		}

		this._tileContainer.innerHTML = '';

		if (this._animated && e && e.hard) {
			this._clearBgBuffer();
		}

		this._initContainer();
	},

	_getTileSize: function () {
		var map = this._map,
		    zoom = map.getZoom() + this.options.zoomOffset,
		    zoomN = this.options.maxNativeZoom,
		    tileSize = this.options.tileSize;

		if (zoomN && zoom > zoomN) {
			tileSize = Math.round(map.getZoomScale(zoom) / map.getZoomScale(zoomN) * tileSize);
		}

		return tileSize;
	},

	_update: function () {

		if (!this._map) { return; }

		var map = this._map,
		    bounds = map.getPixelBounds(),
		    zoom = map.getZoom(),
		    tileSize = this._getTileSize();

		if (zoom > this.options.maxZoom || zoom < this.options.minZoom) {
			return;
		}

		var tileBounds = EzServerClient.bounds(
		        bounds.min.divideBy(tileSize)._floor(),
		        bounds.max.divideBy(tileSize)._floor());
		
		this._addTilesFromCenterOut(tileBounds);

		if (this.options.unloadInvisibleTiles || this.options.reuseTiles) {
			this._removeOtherTiles(tileBounds);
		}
	},

	_addTilesFromCenterOut: function (bounds) {
		var queue = [],
		    center = bounds.getCenter();

		var j, i, point;

		for (j = bounds.min.y; j <= bounds.max.y; j++) {
			for (i = bounds.min.x; i <= bounds.max.x; i++) {
				point = new EzServerClient.Point(i, j);

				//qianleyi Beijing54
				if (this._tileShouldBeLoaded(point)) {
					queue.push(point);
				}
			}
		}

		var tilesToLoad = queue.length;

		if (tilesToLoad === 0) { return; }

		// load tiles in order of their distance to center
		queue.sort(function (a, b) {
			return a.distanceTo(center) - b.distanceTo(center);
		});

		var fragment = document.createDocumentFragment();

		// if its the first batch of tiles to load
		if (!this._tilesToLoad) {
			this.fire('loading');
		}

		this._tilesToLoad += tilesToLoad;

		for (i = 0; i < tilesToLoad; i++) {
			this._addTile(queue[i], fragment);
		}

		this._tileContainer.appendChild(fragment);
	},

	_tileShouldBeLoaded: function (tilePoint) {
		if ((tilePoint.x + ':' + tilePoint.y) in this._tiles) {
			return false; // already loaded
		}

		var options = this.options;

		if (!options.continuousWorld && (ezMap.MapCoordinateType === 1)) {
			var limit = this._getWrapTileNum();

			// don't load if exceeds world bounds
			if (this._map.options.isEzMap) {
				if ((options.noWrap && (tilePoint.x >= limit.x)) ||
				 tilePoint.y >= limit.y) { return false; }
			}
			else{
				if ((options.noWrap && (tilePoint.x < 0 || tilePoint.x >= limit.x)) ||
				tilePoint.y < 0 || tilePoint.y >= limit.y) { return false; }
			}
		}

		if (options.bounds) {
			var tileSize = options.tileSize,
			    nwPoint = tilePoint.multiplyBy(tileSize),
			    sePoint = nwPoint.add([tileSize, tileSize]),
			    nw = this._map.unproject(nwPoint),
			    se = this._map.unproject(sePoint);

			// TODO temporary hack, will be removed after refactoring projections
			// https://github.com/Leaflet/Leaflet/issues/1618
			if (!options.continuousWorld && !options.noWrap) {
				nw = nw.wrap();
				se = se.wrap();
			}

			if (!options.bounds.intersects([nw, se])) { return false; }
		}

		return true;
	},

	_removeOtherTiles: function (bounds) {
		var kArr, x, y, key;

		for (key in this._tiles) {
			kArr = key.split(':');
			x = parseInt(kArr[0], 10);
			y = parseInt(kArr[1], 10);

			// remove tile if it's out of bounds
			if (x < bounds.min.x || x > bounds.max.x || y < bounds.min.y || y > bounds.max.y) {
				this._removeTile(key);
			}
		}
	},

	_removeTile: function (key) {
		var tile = this._tiles[key];

		this.fire('tileunload', {tile: tile, url: tile.src});

		if (this.options.reuseTiles) {
			EzServerClient.DomUtil.removeClass(tile, 'leaflet-tile-loaded');
			this._unusedTiles.push(tile);

		} else if (tile.parentNode === this._tileContainer) {
			this._tileContainer.removeChild(tile);
		}

		// for https://github.com/CloudMade/Leaflet/issues/137
		if (!EzServerClient.Browser.android) {
			tile.onload = null;
			tile.src = EzServerClient.Util.emptyImageUrl;
		}

		delete this._tiles[key];
	},

	_addTile: function (tilePoint, container) {
		var tilePos = this._getTilePos(tilePoint);

		// get unused tile - or create a new tile
		var tile = this._getTile();

		/*
		Chrome 20 layouts much faster with top/left (verify with timeline, frames)
		Android 4 browser has display issues with top/left and requires transform instead
		(other browsers don't currently care) - see debug/hacks/jitter.html for an example
		*/
		EzServerClient.DomUtil.setPosition(tile, tilePos, EzServerClient.Browser.chrome);

		this._tiles[tilePoint.x + ':' + tilePoint.y] = tile;
		this._map._hotspotareas[tilePoint.x + ':' + tilePoint.y] = [];

		this._loadTile(tile, tilePoint);

		if (tile.parentNode !== this._tileContainer) {
			container.appendChild(tile);
		}
	},

	_getZoomForUrl: function () {

		var options = this.options,
		    zoom = this._map.getZoom();

		if (options.zoomReverse) {
			zoom = options.maxZoom - zoom;
		}

		zoom += options.zoomOffset;

		return options.maxNativeZoom ? Math.min(zoom, options.maxNativeZoom) : zoom;
	},

	_getTilePos: function (tilePoint) {
		var origin = this._map.getPixelOrigin(),
		    tileSize = this._getTileSize();

		/**
		 * @author [qianleyi]
		 */
		if(this._map.options.isEzMap){
			var x = tilePoint.multiplyBy(tileSize).x - origin.x;
			var y = origin.y - tilePoint.multiplyBy(tileSize).y - 256;
			return new EzServerClient.Point(x, y);
		}
		else{
			return tilePoint.multiplyBy(tileSize).subtract(origin);
		}
	},

	// image-specific code (override to implement e.g. Canvas or SVG tile layer)

	getTileUrl: function (url,tilePoint) {
		return EzServerClient.Util.template(url, EzServerClient.extend({
			s: this._getSubdomain(tilePoint),
			z: tilePoint.z,
			x: tilePoint.x,
			y: tilePoint.y
		}, this.options));
	},

	_getWrapTileNum: function () {
		var crs = this._map.options.crs,
		    size = crs.getSize(this._map.getZoom());
		return size.divideBy(this._getTileSize())._floor();
	},

	_adjustTilePoint: function (tilePoint) {

		var limit = this._getWrapTileNum();

		// wrap tile coordinates
		if (!this.options.continuousWorld && !this.options.noWrap) {
			/**
			 * @author [qianleyi]
			 * @date [2014.7.18]
			 * @description [EzMap锛�涓鸿��兼�锛���������剧ず���]
			 */
			if (!this._map.options.isEzMap) {
				tilePoint.x = ((tilePoint.x % limit.x) + limit.x) % limit.x;
			}

			tilePoint.x = ((tilePoint.x % limit.x) + limit.x) % limit.x;
		}

		if (this.options.tms) {
			tilePoint.y = limit.y - tilePoint.y - 1;
		}

		tilePoint.z = this._getZoomForUrl();
	},

	_getSubdomain: function (tilePoint) {
		var index = Math.abs(tilePoint.x + tilePoint.y) % this.options.subdomains.length;
		return this.options.subdomains[index];
	},

	_getTile: function () {
		if (this.options.reuseTiles && this._unusedTiles.length > 0) {
			var tile = this._unusedTiles.pop();
			this._resetTile(tile);
			return tile;
		}
		return this._createTile();
	},

	// Override if data stored on a tile needs to be cleaned up before reuse
	_resetTile: function (/*tile*/) {},

	_createTile: function () {
		var tile = EzServerClient.DomUtil.create('img', 'leaflet-tile');
		tile.style.width = tile.style.height = this._getTileSize() + 'px';
		tile.galleryimg = 'no';

		tile.onselectstart = tile.onmousemove = EzServerClient.Util.falseFn;

		if (EzServerClient.Browser.ielt9 && this.options.opacity !== undefined) {
			EzServerClient.DomUtil.setOpacity(tile, this.options.opacity);
		}
		// without this hack, tiles disappear after zoom on Chrome for Android
		// https://github.com/Leaflet/Leaflet/issues/2078
		if (EzServerClient.Browser.mobileWebkit3d) {
			tile.style.WebkitBackfaceVisibility = 'hidden';
		}
		return tile;
	},

	_loadTile: function (tile, tilePoint) {
		tile._layer  = this;
		tile.onload  = this._tileOnLoad;
		tile.onerror = this._tileOnError;

		this._adjustTilePoint(tilePoint);
		tile.src     = this.getTileUrl(this._url,tilePoint);

		this.fire('tileloadstart', {
			tile: tile,
			url: tile.src
		});
		
		if(!this._proxyURL){
			return;
		}
		
		var hotspoturl = this.getTileUrl(this._hoturl,tilePoint);
		var hoturl = this._proxyURL + "?request=gotourl&url=" + encodeURIComponent(hotspoturl);
		
		var xhr = {};
		
		xhr.xhrObj = this._createXHR();
		xhr.hotspot = this;
		xhr.colAndRow = tilePoint.x + ':' + tilePoint.y;


		xhr.xhrObj.onreadystatechange = EzServerClient.bind(this._ajaxCallBack,xhr); //发送事件后，收到信息了调用函数
		xhr.xhrObj.open("GET",hoturl,true);
		xhr.xhrObj.send(null);
	},
	
	_createXHR: function() {
		var xmlHttpReq;
		if (window.XMLHttpRequest) {
			xmlHttpReq = new XMLHttpRequest();
		}
		else{
			try{
				xmlHttpReq = new ActiveXObject("Msxml2.XMLHTTP");//IE高版本创建XMLHTTP  
			}
			catch(E){
				xmlHttpReq = new ActiveXObject("Microsoft.XMLHTTP");//IE低版本创建XMLHTTP 
			}
		}

		return xmlHttpReq;
	},
	
	_ajaxCallBack:function(){
		var that = this.hotspot,
			colAndRow = this.colAndRow,
			xhr = this.xhrObj;
		
		if (xhr.readyState === 4) {
			if ((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304) {
				var hotspotText = xhr.responseText;
				var v = hotspotText.replace(/((\r\n)+)$/,"").replace(/\r\n/g,",").replace(/(.\d+)$/,"");
				eval("var hotspots=[" + v + "]");
				for(var hotspot in hotspots){
					that._map._hotspotareas[colAndRow].push(hotspots[hotspot]);
				}
			}
		}
	},
	
	setTileProxy:function(url){
		this._proxyURL = url;
	},

	_tileLoaded: function () {
		this._tilesToLoad--;

		if (this._animated) {
			EzServerClient.DomUtil.addClass(this._tileContainer, 'leaflet-zoom-animated');
		}

		if (!this._tilesToLoad) {
			this.fire('load');

			if (this._animated) {
				// clear scaled tiles after all new tiles are loaded (for performance)
				clearTimeout(this._clearBgBufferTimer);
				this._clearBgBufferTimer = setTimeout(EzServerClient.bind(this._clearBgBuffer, this), 500);
			}
		}
	},

	_tileOnLoad: function () {
		var layer = this._layer;

		//Only if we are loading an actual image
		if (this.src !== EzServerClient.Util.emptyImageUrl) {
			EzServerClient.DomUtil.addClass(this, 'leaflet-tile-loaded');

			layer.fire('tileload', {
				tile: this,
				url: this.src
			});
		}

		layer._tileLoaded();
	},

	_tileOnError: function () {
		var layer = this._layer;

		layer.fire('tileerror', {
			tile: this,
			url: this.src
		});

		var newUrl = layer.options.errorTileUrl;
		if (newUrl) {
			this.src = newUrl;
		}

		layer._tileLoaded();
	},

	/**
	 * [tileLayer description]
	 * @param  {[type]} url      [description]
	 * @param  {[type]} options) {	return     new EzServerClient.TileLayer(url, options [description]
	 * @return {[type]}          [description]
	 * @author [qianleyi]
	 */
	clone:function(){
		return new EzServerClient.TileLayer(this._url,this.options);
	}
});

EzServerClient.tileLayer = function (url, options) {
	return new EzServerClient.TileLayer(url, options);
};


EzServerClient.TileLayer.HotSpot2 = EzServerClient.TileLayer.extend({
	includes: EzServerClient.Mixin.Events,

	options: {
		hot:'hot/z{z}/x{x}/z{z}_x{x}_y{y}',
		tile:'tile/z{z}/x{x}/z{z}_x{x}_y{y}',
		icon:null,
		minZoom: 0,
		maxZoom: 18,
		tileSize: 256,
		subdomains: 'abc',
		errorTileUrl: '',
		attribution: '',
		zoomOffset: 0,
		opacity: 1,
		/*
		maxNativeZoom: null,
		zIndex: null,
		tms: false,
		continuousWorld: false,
		noWrap: false,
		zoomReverse: false,
		detectRetina: false,
		reuseTiles: false,
		bounds: false,
		*/
		unloadInvisibleTiles: EzServerClient.Browser.mobile,
		updateWhenIdle: EzServerClient.Browser.mobile
	},

	initialize: function (url, options,hotcallback) {
		options = EzServerClient.setOptions(this, options);

		// detecting retina displays, adjusting tileSize and zoom levels
		if (options.detectRetina && EzServerClient.Browser.retina && options.maxZoom > 0) {

			options.tileSize = Math.floor(options.tileSize / 2);
			options.zoomOffset++;

			if (options.minZoom > 0) {
				options.minZoom--;
			}
			this.options.maxZoom--;
		}

		if (options.bounds) {
			options.bounds = EzServerClient.latLngBounds(options.bounds);
		}
		
		this._hoturl = url + this.options.hot;

		this._url = url + this.options.tile;
		this._tileImage = EzServerClient.tileLayer(this._url);
		
		this._hotcallback = hotcallback;

		var subdomains = this.options.subdomains;

		if (typeof subdomains === 'string') {
			this.options.subdomains = subdomains.split('');
		}
	},

	onAdd: function (map) {
		this._map = map;
		
		map.addLayer(this._tileImage);
		map._hotSpotLayer = this;

		// set up events
		map.on({
			'viewreset': this._reset,
			'moveend': this._update
		}, this);
		
		map.on('mousemove',this._addHotSpot,this);
		
		this._marker = EzServerClient.marker([0,0],{
			icon: this.options.icon
		}).addTo(this._map);
		this._marker.setOpacity(0);
		
		//this._map.popupmarker = null;
		
		this._marker.on('mouseout',function(){
			this.setOpacity(0);
		});
		
		this._marker.on('popupopen',function(){
			this._map.popupmarker = EzServerClient.marker(this._latlng,this.options).addTo(this._map);
		});
		
		this._marker.on('popupclose',function(){
			this._map.removeLayer(this._map.popupmarker);
		});

		this._reset();
		this._update();
	},

	addTo: function (map) {
		map.addLayer(this);
		return this;
	},

	getHotSpotForTileLayer: function(isViewBounds) {
		var arr = [];

		if (!this._map) {
			return;
		}

		for (var i in this._map._hotspotareas) {
			var obj = this._map._hotspotareas[i],
				len = obj.length;

			if (!isViewBounds) {
				arr.push(obj);
			} else {
				var viewBounds = this._map.getBounds(),
					newArr = [];

				for (var j = 0; j < len; j++) {
					var latlng = EzServerClient.latLng(obj[j].Y, obj[j].X);

					if (viewBounds.contains(latlng)) {
						newArr.push(obj[j]);
					}
				}

				arr.push(newArr);
			}
		}

		return arr;
	},

	getHotSpotForPage: function(num,isViewBounds) {
		var arr = this.getHotSpotForTileLayer(isViewBounds),
			tileArrLen = arr.length;

		var arrIndexAndLen = {};
		var sumLen = 0;
		var arrTemp = [];
		for(var i = 0; i < tileArrLen; i++){
			var len = arr[i].length;
			sumLen += len;
			arrIndexAndLen[len] = i;
			arrTemp.push(arr[i].length);
		}

		arrTemp.sort(function(a,b){
			return b - a;
		});

		var sortedArr = [];
		for(var j = 0; j < tileArrLen; j++){
			sortedArr.push(arr[arrIndexAndLen[arrTemp[j]]]);
		}
		
		if (num < tileArrLen) {
			var temp = [];
			for(var k = num; k < tileArrLen; k++){
				temp.concat(sortedArr[k]);
			}
			while(sortedArr.length !== num){
				sortedArr.pop();
			}
			while(m < temp.length){
				var index_sortedArr = m % num;
				sortedArr[index_sortedArr].push(temp[m]);
				m++;
			}
		}

		//free memory
		arr = null;
		arrIndexAndLen = null;
		arrTemp = null;

		//page Array 
		var pageArr = [];
		//ensure the max page number
		var pageNum = Math.ceil(sumLen / num);
		//init the 2-d array
		for(var k = 0; k < pageNum; k++){
			pageArr[k] = [];
		}
		//struct the 2-d array
		var selectLen = sortedArr.length;
		for (var j = 0; j < pageNum; j++){
			var i = 0;
			while(pageArr[j].length !== num){
				if(i >= selectLen){
					i = 0;
				}

				if (sortedArr[i].length !== 0) {
					pageArr[j].push(sortedArr[i].shift());
					i++;
				}
				else{
					i--;
					selectLen = i;
				}

				if (sortedArr[0].length === 0) {
					break;
				}
			}
		}
		return pageArr;
	},

	_getMouseToTopLeftBounds:function(latlng,map){
		var topLeftPoint = map._getTopLeftPoint();

		var bottomRightPoint = map.project(latlng,map.getZoom());
		return new EzServerClient.Bounds(topLeftPoint,bottomRightPoint);
	},
	
	_addHotSpot:function(e){
		var mousebounds = this._getMouseToTopLeftBounds(e.latlng,this._map);
		var containerPoint = e.layerPoint,
			tileSize = this._getTileSize();
		
		var mousetileBounds = EzServerClient.bounds(
				mousebounds.min.divideBy(tileSize)._floor(),
				mousebounds.max.divideBy(tileSize)._floor());
		
		
		if(this._map.options.isEzMap){
			//EzMap 
			var tileID = mousetileBounds.max.x + ':' + mousetileBounds.min.y;
		}
		else{
			//TiDiTu
			var tileID = mousetileBounds.max.x + ':' + mousetileBounds.max.y;
		}
		
		
		if(tileID in this._map._hotspotareas){
			var hotspotArr = this._map._hotspotareas[tileID],
				len = hotspotArr.length;
			for(var i = 0; i < len; i++){
				var hotspotlatlng = EzServerClient.latLng(hotspotArr[i].Y, hotspotArr[i].X),
					hotspotlayerpoint = this._map.latLngToLayerPoint(hotspotlatlng),
					hotspotBounds = EzServerClient.bounds(new Point(hotspotlayerpoint.x-6,hotspotlayerpoint.y-6),new Point(hotspotlayerpoint.x+6,hotspotlayerpoint.y+6));
				
				var data = {
						'ID': hotspotArr[i].ID,
						'LABEL' : hotspotArr[i].LABEL,
						'X': hotspotArr[i].X,
						'Y': hotspotArr[i].Y
				};
				
				if(hotspotBounds.contains(containerPoint)){
					this._marker.setLatLng(hotspotlatlng);
					this._marker._icon.title = hotspotArr[i].LABEL;
					this._marker.setOpacity(1);
					this._marker.bindPopup(this._hotcallback(data));
					break;
				}
			}
		}
	},

	onRemove: function (map) {
		map.removeLayer(this._tileImage);
		map._hotspotareas = null;

		map.off({
			'viewreset': this._reset,
			'moveend': this._update
		}, this);

		map.off('mousemove',this._addHotSpot,this);

		if (this._animated) {
			map.off({
				'zoomanim': this._animateZoom,
				'zoomend': this._endZoomAnim
			}, this);
		}

		if (!this.options.updateWhenIdle) {
			map.off('move', this._limitedUpdate, this);
		}

		this._container = null;
		this._map = null;
		delete map._hotSpotLayer;
	},

	bringToFront: function () {
		var pane = this._map._panes.tilePane;

		if (this._container) {
			pane.appendChild(this._container);
			this._setAutoZIndex(pane, Math.max);
		}

		return this;
	},

	bringToBack: function () {
		var pane = this._map._panes.tilePane;

		if (this._container) {
			pane.insertBefore(this._container, pane.firstChild);
			this._setAutoZIndex(pane, Math.min);
		}

		return this;
	},

	getAttribution: function () {
		return this.options.attribution;
	},

	getContainer: function () {
		return this._container;
	},

	setOpacity: function (opacity) {
		this.options.opacity = opacity;

		if (this._map) {
			this._updateOpacity();
		}

		return this;
	},

	setZIndex: function (zIndex) {
		this.options.zIndex = zIndex;
		this._updateZIndex();

		return this;
	},

	setUrl: function (url, noRedraw) {
		this._url = url;

		if (!noRedraw) {
			this.redraw();
		}

		return this;
	},

	redraw: function () {
		if (this._map) {
			this._reset({hard: true});
			this._update();
		}
		return this;
	},

	_updateZIndex: function () {
		if (this._container && this.options.zIndex !== undefined) {
			this._container.style.zIndex = this.options.zIndex;
		}
	},

	_setAutoZIndex: function (pane, compare) {

		var layers = pane.children,
		    edgeZIndex = -compare(Infinity, -Infinity), // -Infinity for max, Infinity for min
		    zIndex, i, len;

		for (i = 0, len = layers.length; i < len; i++) {

			if (layers[i] !== this._container) {
				zIndex = parseInt(layers[i].style.zIndex, 10);

				if (!isNaN(zIndex)) {
					edgeZIndex = compare(edgeZIndex, zIndex);
				}
			}
		}

		this.options.zIndex = this._container.style.zIndex =
		        (isFinite(edgeZIndex) ? edgeZIndex : 0) + compare(1, -1);
	},

	_updateOpacity: function () {
		var i,
		    tiles = this._tiles;

		if (EzServerClient.Browser.ielt9) {
			for (i in tiles) {
				EzServerClient.DomUtil.setOpacity(tiles[i], this.options.opacity);
			}
		} else {
			EzServerClient.DomUtil.setOpacity(this._container, this.options.opacity);
		}
	},

	_reset: function (e) {
		this._map._hotspotareas = {};
		
		this._tilesToLoad = 0;
	},

	_getTileSize: function () {
		var map = this._map,
		    zoom = map.getZoom() + this.options.zoomOffset,
		    zoomN = this.options.maxNativeZoom,
		    tileSize = this.options.tileSize;

		if (zoomN && zoom > zoomN) {
			tileSize = Math.round(map.getZoomScale(zoom) / map.getZoomScale(zoomN) * tileSize);
		}

		return tileSize;
	},

	_update: function () {

		if (!this._map) { return; }

		var map = this._map,
		    bounds = map.getPixelBounds(),
		    zoom = map.getZoom(),
		    tileSize = this._getTileSize();

		if (zoom > this.options.maxZoom || zoom < this.options.minZoom) {
			return;
		}

		var tileBounds = EzServerClient.bounds(
		        bounds.min.divideBy(tileSize)._floor(),
		        bounds.max.divideBy(tileSize)._floor());
		
		this._addTilesFromCenterOut(tileBounds);

		if (this.options.unloadInvisibleTiles || this.options.reuseTiles) {
			this._removeOtherTiles(tileBounds);
		}
	},

	_updateColAnRow:function(bounds){
		for(var i in this._map._hotspotareas){
			var temp = i.split(':'),
				point = new EzServerClient.Point(temp[0],temp[1]);

			if (!bounds.contains(point)) {
				this._map._hotspotareas[i] = null;
				delete this._map._hotspotareas[i];
			}
		}
	},

	_addTilesFromCenterOut: function (bounds) {
		var queue = [],
		    center = bounds.getCenter();

		var j, i, point;

		this._updateColAnRow(bounds);

		for (j = bounds.min.y; j <= bounds.max.y; j++) {
			for (i = bounds.min.x; i <= bounds.max.x; i++) {
				point = new EzServerClient.Point(i, j);

				//qianleyi Beijing54
				if (this._tileShouldBeLoaded(point)) {
					queue.push(point);
				}
			}
		}

		var tilesToLoad = queue.length;

		if (tilesToLoad === 0) { return; }

		// load tiles in order of their distance to center
		queue.sort(function (a, b) {
			return a.distanceTo(center) - b.distanceTo(center);
		});

		this._tilesToLoad += tilesToLoad;

		for (i = 0; i < tilesToLoad; i++) {
			this._addTile(queue[i]);
		}
	},

	_tileShouldBeLoaded: function (tilePoint) {
		if ((tilePoint.x + ':' + tilePoint.y) in this._map._hotspotareas) {
			return false; // already loaded
		}

		var options = this.options;

		if (!options.continuousWorld && (ezMap.MapCoordinateType === 1)) {
			var limit = this._getWrapTileNum();

			// don't load if exceeds world bounds
			if (this._map.options.isEzMap) {
				if ((options.noWrap && (tilePoint.x >= limit.x)) ||
				 tilePoint.y >= limit.y) { return false; }
			}
			else{
				if ((options.noWrap && (tilePoint.x < 0 || tilePoint.x >= limit.x)) ||
				tilePoint.y < 0 || tilePoint.y >= limit.y) { return false; }
			}
		}

		if (options.bounds) {
			var tileSize = options.tileSize,
			    nwPoint = tilePoint.multiplyBy(tileSize),
			    sePoint = nwPoint.add([tileSize, tileSize]),
			    nw = this._map.unproject(nwPoint),
			    se = this._map.unproject(sePoint);

			// TODO temporary hack, will be removed after refactoring projections
			// https://github.com/Leaflet/Leaflet/issues/1618
			if (!options.continuousWorld && !options.noWrap) {
				nw = nw.wrap();
				se = se.wrap();
			}

			if (!options.bounds.intersects([nw, se])) { return false; }
		}

		return true;
	},

	_removeOtherTiles: function (bounds) {
		var kArr, x, y, key;

		for (key in this._tiles) {
			kArr = key.split(':');
			x = parseInt(kArr[0], 10);
			y = parseInt(kArr[1], 10);

			// remove tile if it's out of bounds
			if (x < bounds.min.x || x > bounds.max.x || y < bounds.min.y || y > bounds.max.y) {
				this._removeTile(key);
			}
		}
	},

	_removeTile: function (key) {
		var tile = this._tiles[key];

		this.fire('tileunload', {tile: tile, url: tile.src});

		if (this.options.reuseTiles) {
			EzServerClient.DomUtil.removeClass(tile, 'leaflet-tile-loaded');
			this._unusedTiles.push(tile);

		} else if (tile.parentNode === this._tileContainer) {
			this._tileContainer.removeChild(tile);
		}

		// for https://github.com/CloudMade/Leaflet/issues/137
		if (!EzServerClient.Browser.android) {
			tile.onload = null;
			tile.src = EzServerClient.Util.emptyImageUrl;
		}

		delete this._tiles[key];
	},

	_addTile: function (tilePoint) {
		var tilePos = this._getTilePos(tilePoint);

		// get unused tile - or create a new tile
		var tile = this._getTile();

		/*
		Chrome 20 layouts much faster with top/left (verify with timeline, frames)
		Android 4 browser has display issues with top/left and requires transform instead
		(other browsers don't currently care) - see debug/hacks/jitter.html for an example
		*/
		EzServerClient.DomUtil.setPosition(tile, tilePos, EzServerClient.Browser.chrome);
		
		this._map._hotspotareas[tilePoint.x + ':' + tilePoint.y] = [];

		this._loadTile(tile, tilePoint);
	},

	_getZoomForUrl: function () {

		var options = this.options,
		    zoom = this._map.getZoom();

		if (options.zoomReverse) {
			zoom = options.maxZoom - zoom;
		}

		zoom += options.zoomOffset;

		return options.maxNativeZoom ? Math.min(zoom, options.maxNativeZoom) : zoom;
	},

	_getTilePos: function (tilePoint) {
		var origin = this._map.getPixelOrigin(),
		    tileSize = this._getTileSize();

		/**
		 * @author [qianleyi]
		 */
		if(this._map.options.isEzMap){
			var x = tilePoint.multiplyBy(tileSize).x - origin.x;
			var y = origin.y - tilePoint.multiplyBy(tileSize).y - 256;
			return new EzServerClient.Point(x, y);
		}
		else{
			return tilePoint.multiplyBy(tileSize).subtract(origin);
		}
	},

	// image-specific code (override to implement e.g. Canvas or SVG tile layer)

	getTileUrl: function (url,tilePoint) {
		return EzServerClient.Util.template(url, EzServerClient.extend({
			s: this._getSubdomain(tilePoint),
			z: tilePoint.z,
			x: tilePoint.x,
			y: tilePoint.y
		}, this.options));
	},

	_getWrapTileNum: function () {
		var crs = this._map.options.crs,
		    size = crs.getSize(this._map.getZoom());
		return size.divideBy(this._getTileSize())._floor();
	},

	_adjustTilePoint: function (tilePoint) {

		var limit = this._getWrapTileNum();

		// wrap tile coordinates
		if (!this.options.continuousWorld && !this.options.noWrap) {
			/**
			 * @author [qianleyi]
			 * @date [2014.7.18]
			 * @description [EzMap锛�涓鸿��兼�锛���������剧ず���]
			 */
			if (!this._map.options.isEzMap) {
				tilePoint.x = ((tilePoint.x % limit.x) + limit.x) % limit.x;
			}

			tilePoint.x = ((tilePoint.x % limit.x) + limit.x) % limit.x;
		}

		if (this.options.tms) {
			tilePoint.y = limit.y - tilePoint.y - 1;
		}

		tilePoint.z = this._getZoomForUrl();
	},

	_getSubdomain: function (tilePoint) {
		var index = Math.abs(tilePoint.x + tilePoint.y) % this.options.subdomains.length;
		return this.options.subdomains[index];
	},

	_getTile: function () {
		if (this.options.reuseTiles && this._unusedTiles.length > 0) {
			var tile = this._unusedTiles.pop();
			this._resetTile(tile);
			return tile;
		}
		return this._createTile();
	},

	// Override if data stored on a tile needs to be cleaned up before reuse
	_resetTile: function (/*tile*/) {},

	_createTile: function () {
		var tile = EzServerClient.DomUtil.create('img', 'leaflet-tile');
		tile.style.width = tile.style.height = this._getTileSize() + 'px';
		tile.galleryimg = 'no';

		tile.onselectstart = tile.onmousemove = EzServerClient.Util.falseFn;

		if (EzServerClient.Browser.ielt9 && this.options.opacity !== undefined) {
			EzServerClient.DomUtil.setOpacity(tile, this.options.opacity);
		}
		// without this hack, tiles disappear after zoom on Chrome for Android
		// https://github.com/Leaflet/Leaflet/issues/2078
		if (EzServerClient.Browser.mobileWebkit3d) {
			tile.style.WebkitBackfaceVisibility = 'hidden';
		}
		return tile;
	},

	_loadTile: function (tile, tilePoint) {
		tile._layer  = this;
		tile.onload  = this._tileOnLoad;
		tile.onerror = this._tileOnError;

		this._adjustTilePoint(tilePoint);
		tile.src     = this.getTileUrl(this._url,tilePoint);
		
		if(!this._proxyURL){
			return;
		}
		
		var hotspoturl = this.getTileUrl(this._hoturl,tilePoint);
		var hoturl = this._proxyURL + "?request=gotourl&url=" + encodeURIComponent(hotspoturl);
		
		var xhr = {};
		
		xhr.xhrObj = this._createXHR();
		xhr.hotspot = this;
		xhr.colAndRow = tilePoint.x + ':' + tilePoint.y;


		xhr.xhrObj.onreadystatechange = EzServerClient.bind(this._ajaxCallBack,xhr); //发送事件后，收到信息了调用函数
		xhr.xhrObj.open("GET",hoturl,true);
		xhr.xhrObj.send(null);
	},
	
	_createXHR: function() {
		var xmlHttpReq;
		if (window.XMLHttpRequest) {
			xmlHttpReq = new XMLHttpRequest();
		}
		else{
			try{
				xmlHttpReq = new ActiveXObject("Msxml2.XMLHTTP");//IE高版本创建XMLHTTP  
			}
			catch(E){
				xmlHttpReq = new ActiveXObject("Microsoft.XMLHTTP");//IE低版本创建XMLHTTP 
			}
		}

		return xmlHttpReq;
	},
	
	_ajaxCallBack:function(){
		var that = this.hotspot,
			colAndRow = this.colAndRow,
			xhr = this.xhrObj;
		
		if (xhr.readyState === 4) {
			if ((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304) {
				var hotspotText = xhr.responseText;
				var v = hotspotText.replace(/((\r\n)+)$/,"").replace(/\r\n/g,",").replace(/(.\d+)$/,"");
				eval("var hotspots=[" + v + "]");
				for(var hotspot in hotspots){
					that._map._hotspotareas[colAndRow].push(hotspots[hotspot]);
				}
			}
		}
	},
	
	setTileProxy:function(url){
		this._proxyURL = url;
	},

	_tileLoaded: function () {
		this._tilesToLoad--;

		if (this._animated) {
			EzServerClient.DomUtil.addClass(this._tileContainer, 'leaflet-zoom-animated');
		}

		if (!this._tilesToLoad) {
			this.fire('load');

			if (this._animated) {
				// clear scaled tiles after all new tiles are loaded (for performance)
				clearTimeout(this._clearBgBufferTimer);
				this._clearBgBufferTimer = setTimeout(EzServerClient.bind(this._clearBgBuffer, this), 500);
			}
		}
	},

	_tileOnLoad: function () {
		var layer = this._layer;

		//Only if we are loading an actual image
		if (this.src !== EzServerClient.Util.emptyImageUrl) {
			EzServerClient.DomUtil.addClass(this, 'leaflet-tile-loaded');

			layer.fire('tileload', {
				tile: this,
				url: this.src
			});
		}

		layer._tileLoaded();
	},

	_tileOnError: function () {
		var layer = this._layer;

		layer.fire('tileerror', {
			tile: this,
			url: this.src
		});

		var newUrl = layer.options.errorTileUrl;
		if (newUrl) {
			this.src = newUrl;
		}

		layer._tileLoaded();
	},

	/**
	 * [tileLayer description]
	 * @param  {[type]} url      [description]
	 * @param  {[type]} options) {	return     new EzServerClient.TileLayer(url, options [description]
	 * @return {[type]}          [description]
	 * @author [qianleyi]
	 */
	clone:function(){
		return new EzServerClient.TileLayer(this._url,this.options);
	}
});

EzServerClient.tileLayer = function (url, options) {
	return new EzServerClient.TileLayer(url, options);
};


/*
 * EzServerClient.ImageOverlay is used to overlay images over the map (to specific geographical bounds).
 */

EzServerClient.ImageOverlay = EzServerClient.Class.extend({
	includes: EzServerClient.Mixin.Events,

	options: {
		opacity: 1
	},

	initialize: function (url, bounds, options) { // (String, LatLngBounds, Object)
		this._url = url;
		this._bounds = EzServerClient.latLngBounds(bounds);

		EzServerClient.setOptions(this, options);
	},

	onAdd: function (map) {
		this._map = map;

		if (!this._image) {
			this._initImage();
		}

		map._panes.overlayPane.appendChild(this._image);

		map.on('viewreset', this._reset, this);

		if (map.options.zoomAnimation && EzServerClient.Browser.any3d) {
			map.on('zoomanim', this._animateZoom, this);
		}

		this._reset();
	},

	onRemove: function (map) {
		map.getPanes().overlayPane.removeChild(this._image);

		map.off('viewreset', this._reset, this);

		if (map.options.zoomAnimation) {
			map.off('zoomanim', this._animateZoom, this);
		}
	},

	addTo: function (map) {
		map.addLayer(this);
		return this;
	},

	setOpacity: function (opacity) {
		this.options.opacity = opacity;
		this._updateOpacity();
		return this;
	},

	// TODO remove bringToFront/bringToBack duplication from TileLayer/Path
	bringToFront: function () {
		if (this._image) {
			this._map._panes.overlayPane.appendChild(this._image);
		}
		return this;
	},

	bringToBack: function () {
		var pane = this._map._panes.overlayPane;
		if (this._image) {
			pane.insertBefore(this._image, pane.firstChild);
		}
		return this;
	},

	setUrl: function (url) {
		this._url = url;
		this._image.src = this._url;
	},

	getAttribution: function () {
		return this.options.attribution;
	},

	_initImage: function () {
		this._image = EzServerClient.DomUtil.create('img', 'leaflet-image-layer');

		if (this._map.options.zoomAnimation && EzServerClient.Browser.any3d) {
			EzServerClient.DomUtil.addClass(this._image, 'leaflet-zoom-animated');
		} else {
			EzServerClient.DomUtil.addClass(this._image, 'leaflet-zoom-hide');
		}

		this._updateOpacity();

		//TODO createImage util method to remove duplication
		EzServerClient.extend(this._image, {
			galleryimg: 'no',
			onselectstart: EzServerClient.Util.falseFn,
			onmousemove: EzServerClient.Util.falseFn,
			onload: EzServerClient.bind(this._onImageLoad, this),
			src: this._url
		});
	},

	_animateZoom: function (e) {
		var map = this._map,
		    image = this._image,
		    scale = map.getZoomScale(e.zoom),
		    nw = this._bounds.getNorthWest(),
		    se = this._bounds.getSouthEast(),

		    topLeft = map._latLngToNewLayerPoint(nw, e.zoom, e.center),
		    size = map._latLngToNewLayerPoint(se, e.zoom, e.center)._subtract(topLeft),
		    origin = topLeft._add(size._multiplyBy((1 / 2) * (1 - 1 / scale)));

		image.style[EzServerClient.DomUtil.TRANSFORM] =
		        EzServerClient.DomUtil.getTranslateString(origin) + ' scale(' + scale + ') ';
	},

	_reset: function () {
		var image   = this._image,
		    topLeft = this._map.latLngToLayerPoint(this._bounds.getNorthWest()),
		    size = this._map.latLngToLayerPoint(this._bounds.getSouthEast())._subtract(topLeft);

		EzServerClient.DomUtil.setPosition(image, topLeft);

		image.style.width  = size.x + 'px';
		image.style.height = size.y + 'px';
	},

	_onImageLoad: function () {
		this.fire('load');
	},

	_updateOpacity: function () {
		EzServerClient.DomUtil.setOpacity(this._image, this.options.opacity);
	}
});

EzServerClient.imageOverlay = function (url, bounds, options) {
	return new EzServerClient.ImageOverlay(url, bounds, options);
};


/*
 * EzServerClient.Icon is an image-based icon class that you can use with EzServerClient.Marker for custom markers.
 */

EzServerClient.Icon = EzServerClient.Class.extend({
	options: {
		/*
		iconUrl: (String) (required)
		iconRetinaUrl: (String) (optional, used for retina devices if detected)
		iconSize: (Point) (can be set through CSS)
		iconAnchor: (Point) (centered by default, can be set in CSS with negative margins)
		popupAnchor: (Point) (if not specified, popup opens in the anchor point)
		shadowUrl: (String) (no shadow by default)
		shadowRetinaUrl: (String) (optional, used for retina devices if detected)
		shadowSize: (Point)
		shadowAnchor: (Point)
		*/
		className: ''
	},

	initialize: function (options) {
		EzServerClient.setOptions(this, options);
	},

	createIcon: function (oldIcon) {
		return this._createIcon('icon', oldIcon);
	},

	createShadow: function (oldIcon) {
		return this._createIcon('shadow', oldIcon);
	},

	_createIcon: function (name, oldIcon) {
		var src = this._getIconUrl(name);

		if (!src) {
			if (name === 'icon') {
				throw new Error('iconUrl not set in Icon options (see the docs).');
			}
			return null;
		}

		var img;
		if (!oldIcon || oldIcon.tagName !== 'IMG') {
			img = this._createImg(src);
		} else {
			img = this._createImg(src, oldIcon);
		}
		this._setIconStyles(img, name);

		return img;
	},

	_setIconStyles: function (img, name) {
		var options = this.options,
		    size = EzServerClient.point(options[name + 'Size']),
		    anchor;

		if (name === 'shadow') {
			anchor = EzServerClient.point(options.shadowAnchor || options.iconAnchor);
		} else {
			anchor = EzServerClient.point(options.iconAnchor);
		}

		if (!anchor && size) {
			anchor = size.divideBy(2, true);
		}

		img.className = 'leaflet-marker-' + name + ' ' + options.className;

		if (anchor) {
			img.style.marginLeft = (-anchor.x) + 'px';
			img.style.marginTop  = (-anchor.y) + 'px';
		}

		if (size) {
			img.style.width  = size.x + 'px';
			img.style.height = size.y + 'px';
		}
	},

	_createImg: function (src, el) {
		el = el || document.createElement('img');
		el.src = src;
		return el;
	},

	_getIconUrl: function (name) {
		if (EzServerClient.Browser.retina && this.options[name + 'RetinaUrl']) {
			return this.options[name + 'RetinaUrl'];
		}
		return this.options[name + 'Url'];
	}
});

EzServerClient.icon = function (options) {
	return new EzServerClient.Icon(options);
};


/*
 * EzServerClient.Icon.Default is the blue marker icon used by default in Leaflet.
 */

EzServerClient.Icon.Default = EzServerClient.Icon.extend({

	options: {
		iconSize: [25, 41],
		iconAnchor: [12, 41],
		popupAnchor: [1, -34],

		shadowSize: [41, 41]
	},

	_getIconUrl: function (name) {
		var key = name + 'Url';

		if (this.options[key]) {
			return this.options[key];
		}

		if (EzServerClient.Browser.retina && name === 'icon') {
			name += '-2x';
		}

		var path = EzServerClient.Icon.Default.imagePath;

		if (!path) {
			throw new Error('Couldn\'t autodetect EzServerClient.Icon.Default.imagePath, set it manually.');
		}

		return path + '/marker-' + name + '.png';
	}
});

EzServerClient.Icon.Default.imagePath = (function () {
	var scripts = document.getElementsByTagName('script'),
	    leafletRe = /[\/^]EzServerClient[\-\._]?([\w\-\._]*)\.js\??/;

	var i, len, src, matches, path;

	for (i = 0, len = scripts.length; i < len; i++) {
		src = scripts[i].src;
		matches = src.match(leafletRe);

		if (matches) {
			path = src.split(leafletRe)[0];
			return (path ? path + '/' : '') + 'images';
		}
	}
}());


/*
 * EzServerClient.Marker is used to display clickable/draggable icons on the map.
 */

EzServerClient.Marker = EzServerClient.Class.extend({

	includes: EzServerClient.Mixin.Events,

	options: {
		icon: new EzServerClient.Icon.Default(),
		title: '',
		alt: '',
		clickable: true,
		draggable: false,
		keyboard: true,
		zIndexOffset: 0,
		opacity: 1,
		riseOnHover: false,
		riseOffset: 250
	},

	initialize: function (latlng, options) {
		EzServerClient.setOptions(this, options);
		this._latlng = EzServerClient.latLng(latlng);
	},

	onAdd: function (map) {
		this._map = map;

		map.on('viewreset', this.update, this);

		this._initIcon();
		this.update();
		this.fire('add');

		if (map.options.zoomAnimation && map.options.markerZoomAnimation) {
			map.on('zoomanim', this._animateZoom, this);
		}
	},

	addTo: function (map) {
		map.addLayer(this);
		return this;
	},

	onRemove: function (map) {
		if (this.dragging) {
			this.dragging.disable();
		}

		this._removeIcon();
		this._removeShadow();

		this.fire('remove');

		map.off({
			'viewreset': this.update,
			'zoomanim': this._animateZoom
		}, this);

		this._map = null;
	},

	getLatLng: function () {
		return this._latlng;
	},

	setLatLng: function (latlng) {
		this._latlng = EzServerClient.latLng(latlng);

		this.update();

		return this.fire('move', { latlng: this._latlng });
	},

	setZIndexOffset: function (offset) {
		this.options.zIndexOffset = offset;
		this.update();

		return this;
	},

	setIcon: function (icon) {

		this.options.icon = icon;

		if (this._map) {
			this._initIcon();
			this.update();
		}

		if (this._popup) {
			this.bindPopup(this._popup);
		}

		return this;
	},

	update: function () {
		if (this._icon) {
			var pos = this._map.latLngToLayerPoint(this._latlng).round();
			this._setPos(pos);
		}

		return this;
	},

	_initIcon: function () {
		var options = this.options,
		    map = this._map,
		    animation = (map.options.zoomAnimation && map.options.markerZoomAnimation),
		    classToAdd = animation ? 'leaflet-zoom-animated' : 'leaflet-zoom-hide';

		var icon = options.icon.createIcon(this._icon),
			addIcon = false;

		// if we're not reusing the icon, remove the old one and init new one
		if (icon !== this._icon) {
			if (this._icon) {
				this._removeIcon();
			}
			addIcon = true;

			if (options.title) {
				icon.title = options.title;
			}
			
			if (options.alt) {
				icon.alt = options.alt;
			}
		}

		EzServerClient.DomUtil.addClass(icon, classToAdd);

		if (options.keyboard) {
			icon.tabIndex = '0';
		}

		this._icon = icon;

		this._initInteraction();

		if (options.riseOnHover) {
			EzServerClient.DomEvent
				.on(icon, 'mouseover', this._bringToFront, this)
				.on(icon, 'mouseout', this._resetZIndex, this);
		}

		var newShadow = options.icon.createShadow(this._shadow),
			addShadow = false;

		if (newShadow !== this._shadow) {
			this._removeShadow();
			addShadow = true;
		}

		if (newShadow) {
			EzServerClient.DomUtil.addClass(newShadow, classToAdd);
		}
		this._shadow = newShadow;


		if (options.opacity < 1) {
			this._updateOpacity();
		}


		var panes = this._map._panes;

		if (addIcon) {
			panes.markerPane.appendChild(this._icon);
		}

		if (newShadow && addShadow) {
			panes.shadowPane.appendChild(this._shadow);
		}
	},

	_removeIcon: function () {
		if (this.options.riseOnHover) {
			EzServerClient.DomEvent
			    .off(this._icon, 'mouseover', this._bringToFront)
			    .off(this._icon, 'mouseout', this._resetZIndex);
		}

		this._map._panes.markerPane.removeChild(this._icon);

		this._icon = null;
	},

	_removeShadow: function () {
		if (this._shadow) {
			this._map._panes.shadowPane.removeChild(this._shadow);
		}
		this._shadow = null;
	},

	_setPos: function (pos) {
		EzServerClient.DomUtil.setPosition(this._icon, pos);

		if (this._shadow) {
			EzServerClient.DomUtil.setPosition(this._shadow, pos);
		}

		this._zIndex = pos.y + this.options.zIndexOffset;

		this._resetZIndex();
	},

	_updateZIndex: function (offset) {
		this._icon.style.zIndex = this._zIndex + offset;
	},

	_animateZoom: function (opt) {
		var pos = this._map._latLngToNewLayerPoint(this._latlng, opt.zoom, opt.center).round();

		this._setPos(pos);
	},

	_initInteraction: function () {

		if (!this.options.clickable) { return; }

		// TODO refactor into something shared with Map/Path/etc. to DRY it up

		var icon = this._icon,
		    events = ['dblclick', 'mousedown', 'mouseover', 'mouseout', 'contextmenu'];

		EzServerClient.DomUtil.addClass(icon, 'leaflet-clickable');
		EzServerClient.DomEvent.on(icon, 'click', this._onMouseClick, this);
		EzServerClient.DomEvent.on(icon, 'keypress', this._onKeyPress, this);

		for (var i = 0; i < events.length; i++) {
			EzServerClient.DomEvent.on(icon, events[i], this._fireMouseEvent, this);
		}

		if (EzServerClient.Handler.MarkerDrag) {
			this.dragging = new EzServerClient.Handler.MarkerDrag(this);

			if (this.options.draggable) {
				this.dragging.enable();
			}
		}
	},

	_onMouseClick: function (e) {
		var wasDragged = this.dragging && this.dragging.moved();

		if (this.hasEventListeners(e.type) || wasDragged) {
			EzServerClient.DomEvent.stopPropagation(e);
		}

		if (wasDragged) { return; }

		if ((!this.dragging || !this.dragging._enabled) && this._map.dragging && this._map.dragging.moved()) { return; }

		this.fire(e.type, {
			originalEvent: e,
			latlng: this._latlng
		});
	},

	_onKeyPress: function (e) {
		if (e.keyCode === 13) {
			this.fire('click', {
				originalEvent: e,
				latlng: this._latlng
			});
		}
	},

	_fireMouseEvent: function (e) {

		this.fire(e.type, {
			originalEvent: e,
			latlng: this._latlng
		});

		// TODO proper custom event propagation
		// this line will always be called if marker is in a FeatureGroup
		if (e.type === 'contextmenu' && this.hasEventListeners(e.type)) {
			EzServerClient.DomEvent.preventDefault(e);
		}
		if (e.type !== 'mousedown') {
			EzServerClient.DomEvent.stopPropagation(e);
		} else {
			EzServerClient.DomEvent.preventDefault(e);
		}
	},

	setOpacity: function (opacity) {
		this.options.opacity = opacity;
		if (this._map) {
			this._updateOpacity();
		}

		return this;
	},

	_updateOpacity: function () {
		EzServerClient.DomUtil.setOpacity(this._icon, this.options.opacity);
		if (this._shadow) {
			EzServerClient.DomUtil.setOpacity(this._shadow, this.options.opacity);
		}
	},

	_bringToFront: function () {
		this._updateZIndex(this.options.riseOffset);
	},

	_resetZIndex: function () {
		this._updateZIndex(0);
	}
});

EzServerClient.marker = function (latlng, options) {
	return new EzServerClient.Marker(latlng, options);
};


/*
 * EzServerClient.DivIcon is a lightweight HTML-based icon class (as opposed to the image-based EzServerClient.Icon)
 * to use with EzServerClient.Marker.
 */

EzServerClient.DivIcon = EzServerClient.Icon.extend({
	options: {
		iconSize: [12, 12], // also can be set through CSS
		/*
		iconAnchor: (Point)
		popupAnchor: (Point)
		html: (String)
		bgPos: (Point)
		*/
		className: '',
		html: false
	},

	createIcon: function (oldIcon) {
		var div = (oldIcon && oldIcon.tagName === 'DIV') ? oldIcon : document.createElement('div'),
		    options = this.options;

		if (options.html !== false) {
			div.innerHTML = options.html;
		} else {
			div.innerHTML = '';
		}

		if (options.bgPos) {
			div.style.backgroundPosition =
			        (-options.bgPos.x) + 'px ' + (-options.bgPos.y) + 'px';
		}

		this._setIconStyles(div, 'icon');
		return div;
	},

	createShadow: function () {
		return null;
	}
});

EzServerClient.divIcon = function (options) {
	return new EzServerClient.DivIcon(options);
};


/*
 * EzServerClient.Popup is used for displaying popups on the map.
 */

EzServerClient.Map.mergeOptions({
	closePopupOnClick: true
});

EzServerClient.Popup = EzServerClient.Class.extend({
	includes: EzServerClient.Mixin.Events,

	options: {
		minWidth: 50,
		maxWidth: 300,
		// maxHeight: null,
		autoPan: true,
		closeButton: true,
		offset: [0, 7],
		autoPanPadding: [5, 5],
		// autoPanPaddingTopLeft: null,
		// autoPanPaddingBottomRight: null,
		keepInView: false,
		className: '',
		zoomAnimation: true
	},

	initialize: function (options, source) {
		EzServerClient.setOptions(this, options);

		this._source = source;
		this._animated = EzServerClient.Browser.any3d && this.options.zoomAnimation;
		this._isOpen = false;
	},

	onAdd: function (map) {
		this._map = map;

		if (!this._container) {
			this._initLayout();
		}

		var animFade = map.options.fadeAnimation;

		if (animFade) {
			EzServerClient.DomUtil.setOpacity(this._container, 0);
		}
		map._panes.popupPane.appendChild(this._container);

		map.on(this._getEvents(), this);

		this.update();

		if (animFade) {
			EzServerClient.DomUtil.setOpacity(this._container, 1);
		}

		this.fire('open');

		map.fire('popupopen', {popup: this});

		if (this._source) {
			this._source.fire('popupopen', {popup: this});
		}
	},

	addTo: function (map) {
		map.addLayer(this);
		return this;
	},

	openOn: function (map) {
		map.openPopup(this);
		return this;
	},

	onRemove: function (map) {
		map._panes.popupPane.removeChild(this._container);

		EzServerClient.Util.falseFn(this._container.offsetWidth); // force reflow

		map.off(this._getEvents(), this);

		if (map.options.fadeAnimation) {
			EzServerClient.DomUtil.setOpacity(this._container, 0);
		}

		this._map = null;

		this.fire('close');

		map.fire('popupclose', {popup: this});

		if (this._source) {
			this._source.fire('popupclose', {popup: this});
		}
	},

	getLatLng: function () {
		return this._latlng;
	},

	setLatLng: function (latlng) {
		this._latlng = EzServerClient.latLng(latlng);
		if (this._map) {
			this._updatePosition();
			this._adjustPan();
		}
		return this;
	},

	getContent: function () {
		return this._content;
	},

	setContent: function (content) {
		this._content = content;
		this.update();
		return this;
	},

	update: function () {
		if (!this._map) { return; }

		this._container.style.visibility = 'hidden';

		this._updateContent();
		this._updateLayout();
		this._updatePosition();

		this._container.style.visibility = '';

		this._adjustPan();
	},

	_getEvents: function () {
		var events = {
			viewreset: this._updatePosition
		};

		if (this._animated) {
			events.zoomanim = this._zoomAnimation;
		}
		if ('closeOnClick' in this.options ? this.options.closeOnClick : this._map.options.closePopupOnClick) {
			events.preclick = this._close;
		}
		if (this.options.keepInView) {
			events.moveend = this._adjustPan;
		}

		return events;
	},

	_close: function () {
		if (this._map) {
			this._map.closePopup(this);
		}
	},

	_initLayout: function () {
		var prefix = 'leaflet-popup',
			containerClass = prefix + ' ' + this.options.className + ' leaflet-zoom-' +
			        (this._animated ? 'animated' : 'hide'),
			container = this._container = EzServerClient.DomUtil.create('div', containerClass),
			closeButton;

		if (this.options.closeButton) {
			closeButton = this._closeButton =
			        EzServerClient.DomUtil.create('a', prefix + '-close-button', container);
			closeButton.href = '#close';
			closeButton.innerHTML = '&#215;';
			EzServerClient.DomEvent.disableClickPropagation(closeButton);

			EzServerClient.DomEvent.on(closeButton, 'click', this._onCloseButtonClick, this);
		}

		var wrapper = this._wrapper =
		        EzServerClient.DomUtil.create('div', prefix + '-content-wrapper', container);
		EzServerClient.DomEvent.disableClickPropagation(wrapper);

		this._contentNode = EzServerClient.DomUtil.create('div', prefix + '-content', wrapper);

		EzServerClient.DomEvent.disableScrollPropagation(this._contentNode);
		EzServerClient.DomEvent.on(wrapper, 'contextmenu', EzServerClient.DomEvent.stopPropagation);

		this._tipContainer = EzServerClient.DomUtil.create('div', prefix + '-tip-container', container);
		this._tip = EzServerClient.DomUtil.create('div', prefix + '-tip', this._tipContainer);
	},

	_updateContent: function () {
		if (!this._content) { return; }

		if (typeof this._content === 'string') {
			this._contentNode.innerHTML = this._content;
		} else {
			while (this._contentNode.hasChildNodes()) {
				this._contentNode.removeChild(this._contentNode.firstChild);
			}
			this._contentNode.appendChild(this._content);
		}
		this.fire('contentupdate');
	},

	_updateLayout: function () {
		var container = this._contentNode,
		    style = container.style;

		style.width = '';
		style.whiteSpace = 'nowrap';

		var width = container.offsetWidth;
		width = Math.min(width, this.options.maxWidth);
		width = Math.max(width, this.options.minWidth);

		style.width = (width + 1) + 'px';
		style.whiteSpace = '';

		style.height = '';

		var height = container.offsetHeight,
		    maxHeight = this.options.maxHeight,
		    scrolledClass = 'leaflet-popup-scrolled';

		if (maxHeight && height > maxHeight) {
			style.height = maxHeight + 'px';
			EzServerClient.DomUtil.addClass(container, scrolledClass);
		} else {
			EzServerClient.DomUtil.removeClass(container, scrolledClass);
		}

		this._containerWidth = this._container.offsetWidth;
	},

	_updatePosition: function () {
		if (!this._map) { return; }

		var pos = this._map.latLngToLayerPoint(this._latlng),
		    animated = this._animated,
		    offset = EzServerClient.point(this.options.offset);

		if (animated) {
			EzServerClient.DomUtil.setPosition(this._container, pos);
		}

		this._containerBottom = -offset.y - (animated ? 0 : pos.y);
		this._containerLeft = -Math.round(this._containerWidth / 2) + offset.x + (animated ? 0 : pos.x);

		// bottom position the popup in case the height of the popup changes (images loading etc)
		this._container.style.bottom = this._containerBottom + 'px';
		this._container.style.left = this._containerLeft + 'px';
	},

	_zoomAnimation: function (opt) {
		var pos = this._map._latLngToNewLayerPoint(this._latlng, opt.zoom, opt.center);

		EzServerClient.DomUtil.setPosition(this._container, pos);
	},

	_adjustPan: function () {
		if (!this.options.autoPan) { return; }

		var map = this._map,
		    containerHeight = this._container.offsetHeight,
		    containerWidth = this._containerWidth,

		    layerPos = new EzServerClient.Point(this._containerLeft, -containerHeight - this._containerBottom);

		if (this._animated) {
			layerPos._add(EzServerClient.DomUtil.getPosition(this._container));
		}

		var containerPos = map.layerPointToContainerPoint(layerPos),
		    padding = EzServerClient.point(this.options.autoPanPadding),
		    paddingTL = EzServerClient.point(this.options.autoPanPaddingTopLeft || padding),
		    paddingBR = EzServerClient.point(this.options.autoPanPaddingBottomRight || padding),
		    size = map.getSize(),
		    dx = 0,
		    dy = 0;

		if (containerPos.x + containerWidth + paddingBR.x > size.x) { // right
			dx = containerPos.x + containerWidth - size.x + paddingBR.x;
		}
		if (containerPos.x - dx - paddingTL.x < 0) { // left
			dx = containerPos.x - paddingTL.x;
		}
		if (containerPos.y + containerHeight + paddingBR.y > size.y) { // bottom
			dy = containerPos.y + containerHeight - size.y + paddingBR.y;
		}
		if (containerPos.y - dy - paddingTL.y < 0) { // top
			dy = containerPos.y - paddingTL.y;
		}

		if (dx || dy) {
			map
			    .fire('autopanstart')
			    .panBy([dx, dy]);
		}
	},

	_onCloseButtonClick: function (e) {
		this._close();
		EzServerClient.DomEvent.stop(e);
	}
});

EzServerClient.popup = function (options, source) {
	return new EzServerClient.Popup(options, source);
};


EzServerClient.Map.include({
	openPopup: function (popup, latlng, options) { // (Popup) or (String || HTMLElement, LatLng[, Object])
		this.closePopup();

		if (!(popup instanceof EzServerClient.Popup)) {
			var content = popup;

			popup = new EzServerClient.Popup(options)
			    .setLatLng(latlng)
			    .setContent(content);
		}
		popup._isOpen = true;

		this._popup = popup;
		return this.addLayer(popup);
	},

	closePopup: function (popup) {
		if (!popup || popup === this._popup) {
			popup = this._popup;
			this._popup = null;
		}
		if (popup) {
			this.removeLayer(popup);
			popup._isOpen = false;
		}
		return this;
	}
});


/*
 * Popup extension to EzServerClient.Marker, adding popup-related methods.
 */

EzServerClient.Marker.include({
	openPopup: function () {
		if (this._popup && this._map && !this._map.hasLayer(this._popup)) {
			this._popup.setLatLng(this._latlng);
			this._map.openPopup(this._popup);
		}

		return this;
	},

	closePopup: function () {
		if (this._popup) {
			this._popup._close();
		}
		return this;
	},

	togglePopup: function () {
		if (this._popup) {
			if (this._popup._isOpen) {
				this.closePopup();
			} else {
				this.openPopup();
			}
		}
		return this;
	},

	bindPopup: function (content, options) {
		var anchor = EzServerClient.point(this.options.icon.options.popupAnchor || [0, 0]);

		anchor = anchor.add(EzServerClient.Popup.prototype.options.offset);

		if (options && options.offset) {
			anchor = anchor.add(options.offset);
		}

		options = EzServerClient.extend({offset: anchor}, options);

		if (!this._popupHandlersAdded) {
			this
			    .on('click', this.togglePopup, this)
			    .on('remove', this.closePopup, this)
			    .on('move', this._movePopup, this);
			this._popupHandlersAdded = true;
		}

		if (content instanceof EzServerClient.Popup) {
			EzServerClient.setOptions(content, options);
			this._popup = content;
		} else {
			this._popup = new EzServerClient.Popup(options, this)
				.setContent(content);
		}

		return this;
	},

	setPopupContent: function (content) {
		if (this._popup) {
			this._popup.setContent(content);
		}
		return this;
	},

	unbindPopup: function () {
		if (this._popup) {
			this._popup = null;
			this
			    .off('click', this.togglePopup, this)
			    .off('remove', this.closePopup, this)
			    .off('move', this._movePopup, this);
			this._popupHandlersAdded = false;
		}
		return this;
	},

	getPopup: function () {
		return this._popup;
	},

	_movePopup: function (e) {
		this._popup.setLatLng(e.latlng);
	}
});


/*
 * EzServerClient.LayerGroup is a class to combine several layers into one so that
 * you can manipulate the group (e.g. add/remove it) as one layer.
 */

EzServerClient.LayerGroup = EzServerClient.Class.extend({
	initialize: function (layers) {
		this._layers = {};

		var i, len;

		if (layers) {
			for (i = 0, len = layers.length; i < len; i++) {
				this.addLayer(layers[i]);
			}
		}
	},

	addLayer: function (layer) {
		var id = this.getLayerId(layer);

		this._layers[id] = layer;

		if (this._map) {
			this._map.addLayer(layer);
		}

		return this;
	},

	removeLayer: function (layer) {
		var id = layer in this._layers ? layer : this.getLayerId(layer);

		if (this._map && this._layers[id]) {
			this._map.removeLayer(this._layers[id]);
		}

		delete this._layers[id];

		return this;
	},

	hasLayer: function (layer) {
		if (!layer) { return false; }

		return (layer in this._layers || this.getLayerId(layer) in this._layers);
	},

	clearLayers: function () {
		this.eachLayer(this.removeLayer, this);
		return this;
	},

	invoke: function (methodName) {
		var args = Array.prototype.slice.call(arguments, 1),
		    i, layer;

		for (i in this._layers) {
			layer = this._layers[i];

			if (layer[methodName]) {
				layer[methodName].apply(layer, args);
			}
		}

		return this;
	},

	onAdd: function (map) {
		this._map = map;
		this.eachLayer(map.addLayer, map);
	},

	onRemove: function (map) {
		this.eachLayer(map.removeLayer, map);
		this._map = null;
	},

	addTo: function (map) {
		map.addLayer(this);
		return this;
	},

	eachLayer: function (method, context) {
		for (var i in this._layers) {
			method.call(context, this._layers[i]);
		}
		return this;
	},

	getLayer: function (id) {
		return this._layers[id];
	},

	getLayers: function () {
		var layers = [];

		for (var i in this._layers) {
			layers.push(this._layers[i]);
		}
		return layers;
	},

	setZIndex: function (zIndex) {
		return this.invoke('setZIndex', zIndex);
	},

	getLayerId: function (layer) {
		return EzServerClient.stamp(layer);
	}
});

EzServerClient.layerGroup = function (layers) {
	return new EzServerClient.LayerGroup(layers);
};


/*
 * EzServerClient.FeatureGroup extends EzServerClient.LayerGroup by introducing mouse events and additional methods
 * shared between a group of interactive layers (like vectors or markers).
 */

EzServerClient.FeatureGroup = EzServerClient.LayerGroup.extend({
	includes: EzServerClient.Mixin.Events,

	statics: {
		EVENTS: 'click dblclick mouseover mouseout mousemove contextmenu popupopen popupclose'
	},

	addLayer: function (layer) {
		if (this.hasLayer(layer)) {
			return this;
		}

		if ('on' in layer) {
			layer.on(EzServerClient.FeatureGroup.EVENTS, this._propagateEvent, this);
		}

		EzServerClient.LayerGroup.prototype.addLayer.call(this, layer);

		if (this._popupContent && layer.bindPopup) {
			layer.bindPopup(this._popupContent, this._popupOptions);
		}

		return this.fire('layeradd', {layer: layer});
	},

	removeLayer: function (layer) {
		if (!this.hasLayer(layer)) {
			return this;
		}
		if (layer in this._layers) {
			layer = this._layers[layer];
		}

		layer.off(EzServerClient.FeatureGroup.EVENTS, this._propagateEvent, this);

		EzServerClient.LayerGroup.prototype.removeLayer.call(this, layer);

		if (this._popupContent) {
			this.invoke('unbindPopup');
		}

		return this.fire('layerremove', {layer: layer});
	},

	bindPopup: function (content, options) {
		this._popupContent = content;
		this._popupOptions = options;
		return this.invoke('bindPopup', content, options);
	},

	openPopup: function (latlng) {
		// open popup on the first layer
		for (var id in this._layers) {
			this._layers[id].openPopup(latlng);
			break;
		}
		return this;
	},

	setStyle: function (style) {
		return this.invoke('setStyle', style);
	},

	bringToFront: function () {
		return this.invoke('bringToFront');
	},

	bringToBack: function () {
		return this.invoke('bringToBack');
	},

	getBounds: function () {
		var bounds = new EzServerClient.LatLngBounds();

		this.eachLayer(function (layer) {
			bounds.extend(layer instanceof EzServerClient.Marker ? layer.getLatLng() : layer.getBounds());
		});

		return bounds;
	},

	_propagateEvent: function (e) {
		e = EzServerClient.extend({
			layer: e.target,
			target: this
		}, e);
		this.fire(e.type, e);
	}
});

EzServerClient.featureGroup = function (layers) {
	return new EzServerClient.FeatureGroup(layers);
};


/*
 * EzServerClient.Path is a base class for rendering vector paths on a map. Inherited by Polyline, Circle, etc.
 */

EzServerClient.Path = EzServerClient.Class.extend({
	includes: [EzServerClient.Mixin.Events],

	statics: {
		// how much to extend the clip area around the map view
		// (relative to its size, e.g. 0.5 is half the screen in each direction)
		// set it so that SVG element doesn't exceed 1280px (vectors flicker on dragend if it is)
		CLIP_PADDING: (function () {
			var max = EzServerClient.Browser.mobile ? 1280 : 2000,
			    target = (max / Math.max(window.outerWidth, window.outerHeight) - 1) / 2;
			return Math.max(0, Math.min(0.5, target));
		})()
	},

	options: {
		stroke: true,
		color: '#0033ff',
		dashArray: null,
		lineCap: null,
		lineJoin: null,
		weight: 5,
		opacity: 0.5,

		fill: false,
		fillColor: null, //same as color by default
		fillOpacity: 0.2,

		clickable: true
	},

	initialize: function (options) {
		EzServerClient.setOptions(this, options);
	},

	onAdd: function (map) {
		this._map = map;

		if (!this._container) {
			this._initElements();
			this._initEvents();
		}

		this.projectLatlngs();
		this._updatePath();

		if (this._container) {
			this._map._pathRoot.appendChild(this._container);
		}

		this.fire('add');

		map.on({
			'viewreset': this.projectLatlngs,
			'moveend': this._updatePath
		}, this);
	},

	addTo: function (map) {
		map.addLayer(this);
		return this;
	},

	onRemove: function (map) {
		map._pathRoot.removeChild(this._container);

		// Need to fire remove event before we set _map to null as the event hooks might need the object
		this.fire('remove');
		this._map = null;

		if (EzServerClient.Browser.vml) {
			this._container = null;
			this._stroke = null;
			this._fill = null;
		}

		map.off({
			'viewreset': this.projectLatlngs,
			'moveend': this._updatePath
		}, this);
	},

	projectLatlngs: function () {
		// do all projection stuff here
	},

	setStyle: function (style) {
		EzServerClient.setOptions(this, style);

		if (this._container) {
			this._updateStyle();
		}

		return this;
	},

	redraw: function () {
		if (this._map) {
			this.projectLatlngs();
			this._updatePath();
		}
		return this;
	}
});

EzServerClient.Map.include({
	_updatePathViewport: function () {
		var p = EzServerClient.Path.CLIP_PADDING,
		    size = this.getSize(),
		    panePos = EzServerClient.DomUtil.getPosition(this._mapPane),
		    min = panePos.multiplyBy(-1)._subtract(size.multiplyBy(p)._round()),
		    max = min.add(size.multiplyBy(1 + p * 2)._round());

		this._pathViewport = new EzServerClient.Bounds(min, max);
	}
});


/*
 * Extends EzServerClient.Path with SVG-specific rendering code.
 */

EzServerClient.Path.SVG_NS = 'http://www.w3.org/2000/svg';

EzServerClient.Browser.svg = !!(document.createElementNS && document.createElementNS(EzServerClient.Path.SVG_NS, 'svg').createSVGRect);

EzServerClient.Path = EzServerClient.Path.extend({
	statics: {
		SVG: EzServerClient.Browser.svg
	},

	bringToFront: function () {
		var root = this._map._pathRoot,
		    path = this._container;

		if (path && root.lastChild !== path) {
			root.appendChild(path);
		}
		return this;
	},

	bringToBack: function () {
		var root = this._map._pathRoot,
		    path = this._container,
		    first = root.firstChild;

		if (path && first !== path) {
			root.insertBefore(path, first);
		}
		return this;
	},

	getPathString: function () {
		// form path string here
	},

	_createElement: function (name) {
		return document.createElementNS(EzServerClient.Path.SVG_NS, name);
	},

	_initElements: function () {
		this._map._initPathRoot();
		this._initPath();
		this._initStyle();
	},

	_initPath: function () {
		this._container = this._createElement('g');

		this._path = this._createElement('path');

		if (this.options.className) {
			EzServerClient.DomUtil.addClass(this._path, this.options.className);
		}

		this._container.appendChild(this._path);
	},

	_initStyle: function () {
		if (this.options.stroke) {
			this._path.setAttribute('stroke-linejoin', 'round');
			this._path.setAttribute('stroke-linecap', 'round');
		}
		if (this.options.fill) {
			this._path.setAttribute('fill-rule', 'evenodd');
		}
		if (this.options.pointerEvents) {
			this._path.setAttribute('pointer-events', this.options.pointerEvents);
		}
		if (!this.options.clickable && !this.options.pointerEvents) {
			this._path.setAttribute('pointer-events', 'none');
		}
		this._updateStyle();
	},

	_updateStyle: function () {
		if (this.options.stroke) {
			this._path.setAttribute('stroke', this.options.color);
			this._path.setAttribute('stroke-opacity', this.options.opacity);
			this._path.setAttribute('stroke-width', this.options.weight);
			if (this.options.dashArray) {
				this._path.setAttribute('stroke-dasharray', this.options.dashArray);
			} else {
				this._path.removeAttribute('stroke-dasharray');
			}
			if (this.options.lineCap) {
				this._path.setAttribute('stroke-linecap', this.options.lineCap);
			}
			if (this.options.lineJoin) {
				this._path.setAttribute('stroke-linejoin', this.options.lineJoin);
			}
		} else {
			this._path.setAttribute('stroke', 'none');
		}
		if (this.options.fill) {
			this._path.setAttribute('fill', this.options.fillColor || this.options.color);
			this._path.setAttribute('fill-opacity', this.options.fillOpacity);
		} else {
			this._path.setAttribute('fill', 'none');
		}
	},

	_updatePath: function () {
		var str = this.getPathString();
		if (!str) {
			// fix webkit empty string parsing bug
			str = 'M0 0';
		}
		this._path.setAttribute('d', str);
	},

	// TODO remove duplication with EzServerClient.Map
	_initEvents: function () {
		if (this.options.clickable) {
			if (EzServerClient.Browser.svg || !EzServerClient.Browser.vml) {
				EzServerClient.DomUtil.addClass(this._path, 'leaflet-clickable');
			}

			EzServerClient.DomEvent.on(this._container, 'click', this._onMouseClick, this);

			var events = ['dblclick', 'mousedown', 'mouseover',
			              'mouseout', 'mousemove', 'contextmenu'];
			for (var i = 0; i < events.length; i++) {
				EzServerClient.DomEvent.on(this._container, events[i], this._fireMouseEvent, this);
			}
		}
	},

	_onMouseClick: function (e) {
		if (this._map.dragging && this._map.dragging.moved()) { return; }

		this._fireMouseEvent(e);
	},

	_fireMouseEvent: function (e) {
		if (!this.hasEventListeners(e.type)) { return; }

		var map = this._map,
		    containerPoint = map.mouseEventToContainerPoint(e),
		    layerPoint = map.containerPointToLayerPoint(containerPoint),
		    latlng = map.layerPointToLatLng(layerPoint);

		this.fire(e.type, {
			latlng: latlng,
			layerPoint: layerPoint,
			containerPoint: containerPoint,
			originalEvent: e
		});

		if (e.type === 'contextmenu') {
			EzServerClient.DomEvent.preventDefault(e);
		}
		if (e.type !== 'mousemove') {
			EzServerClient.DomEvent.stopPropagation(e);
		}
	}
});

EzServerClient.Map.include({
	_initPathRoot: function () {
		if (!this._pathRoot) {
			this._pathRoot = EzServerClient.Path.prototype._createElement('svg');
			this._panes.overlayPane.appendChild(this._pathRoot);

			if (this.options.zoomAnimation && EzServerClient.Browser.any3d) {
				EzServerClient.DomUtil.addClass(this._pathRoot, 'leaflet-zoom-animated');

				this.on({
					'zoomanim': this._animatePathZoom,
					'zoomend': this._endPathZoom
				});
			} else {
				EzServerClient.DomUtil.addClass(this._pathRoot, 'leaflet-zoom-hide');
			}

			this.on('moveend', this._updateSvgViewport);
			this._updateSvgViewport();
		}
	},

	_animatePathZoom: function (e) {
		var scale = this.getZoomScale(e.zoom),
		    offset = this._getCenterOffset(e.center)._multiplyBy(-scale)._add(this._pathViewport.min);

		this._pathRoot.style[EzServerClient.DomUtil.TRANSFORM] =
		        EzServerClient.DomUtil.getTranslateString(offset) + ' scale(' + scale + ') ';

		this._pathZooming = true;
	},

	_endPathZoom: function () {
		this._pathZooming = false;
	},

	_updateSvgViewport: function () {

		if (this._pathZooming) {
			// Do not update SVGs while a zoom animation is going on otherwise the animation will break.
			// When the zoom animation ends we will be updated again anyway
			// This fixes the case where you do a momentum move and zoom while the move is still ongoing.
			return;
		}

		this._updatePathViewport();

		var vp = this._pathViewport,
		    min = vp.min,
		    max = vp.max,
		    width = max.x - min.x,
		    height = max.y - min.y,
		    root = this._pathRoot,
		    pane = this._panes.overlayPane;

		// Hack to make flicker on drag end on mobile webkit less irritating
		if (EzServerClient.Browser.mobileWebkit) {
			pane.removeChild(root);
		}

		EzServerClient.DomUtil.setPosition(root, min);
		root.setAttribute('width', width);
		root.setAttribute('height', height);
		root.setAttribute('viewBox', [min.x, min.y, width, height].join(' '));

		if (EzServerClient.Browser.mobileWebkit) {
			pane.appendChild(root);
		}
	}
});


/*
 * Popup extension to EzServerClient.Path (polylines, polygons, circles), adding popup-related methods.
 */

EzServerClient.Path.include({

	bindPopup: function (content, options) {

		if (content instanceof EzServerClient.Popup) {
			this._popup = content;
		} else {
			if (!this._popup || options) {
				this._popup = new EzServerClient.Popup(options, this);
			}
			this._popup.setContent(content);
		}

		if (!this._popupHandlersAdded) {
			this
			    .on('click', this._openPopup, this)
			    .on('remove', this.closePopup, this);

			this._popupHandlersAdded = true;
		}

		return this;
	},

	unbindPopup: function () {
		if (this._popup) {
			this._popup = null;
			this
			    .off('click', this._openPopup)
			    .off('remove', this.closePopup);

			this._popupHandlersAdded = false;
		}
		return this;
	},

	openPopup: function (latlng) {

		if (this._popup) {
			// open the popup from one of the path's points if not specified
			latlng = latlng || this._latlng ||
			         this._latlngs[Math.floor(this._latlngs.length / 2)];

			this._openPopup({latlng: latlng});
		}

		return this;
	},

	closePopup: function () {
		if (this._popup) {
			this._popup._close();
		}
		return this;
	},

	_openPopup: function (e) {
		this._popup.setLatLng(e.latlng);
		this._map.openPopup(this._popup);
	}
});


/*
 * Vector rendering for IE6-8 through VML.
 * Thanks to Dmitry Baranovsky and his Raphael library for inspiration!
 */

EzServerClient.Browser.vml = !EzServerClient.Browser.svg && (function () {
	try {
		var div = document.createElement('div');
		div.innerHTML = '<v:shape adj="1"/>';

		var shape = div.firstChild;
		shape.style.behavior = 'url(#default#VML)';

		return shape && (typeof shape.adj === 'object');

	} catch (e) {
		return false;
	}
}());

EzServerClient.Path = EzServerClient.Browser.svg || !EzServerClient.Browser.vml ? EzServerClient.Path : EzServerClient.Path.extend({
	statics: {
		VML: true,
		CLIP_PADDING: 0.02
	},

	_createElement: (function () {
		try {
			document.namespaces.add('lvml', 'urn:schemas-microsoft-com:vml');
			return function (name) {
				return document.createElement('<lvml:' + name + ' class="lvml">');
			};
		} catch (e) {
			return function (name) {
				return document.createElement(
				        '<' + name + ' xmlns="urn:schemas-microsoft.com:vml" class="lvml">');
			};
		}
	}()),

	_initPath: function () {
		var container = this._container = this._createElement('shape');

		EzServerClient.DomUtil.addClass(container, 'leaflet-vml-shape' +
			(this.options.className ? ' ' + this.options.className : ''));

		if (this.options.clickable) {
			EzServerClient.DomUtil.addClass(container, 'leaflet-clickable');
		}

		container.coordsize = '1 1';

		this._path = this._createElement('path');
		container.appendChild(this._path);

		this._map._pathRoot.appendChild(container);
	},

	_initStyle: function () {
		this._updateStyle();
	},

	_updateStyle: function () {
		var stroke = this._stroke,
		    fill = this._fill,
		    options = this.options,
		    container = this._container;

		container.stroked = options.stroke;
		container.filled = options.fill;

		if (options.stroke) {
			if (!stroke) {
				stroke = this._stroke = this._createElement('stroke');
				stroke.endcap = 'round';
				container.appendChild(stroke);
			}
			stroke.weight = options.weight + 'px';
			stroke.color = options.color;
			stroke.opacity = options.opacity;

			if (options.dashArray) {
				stroke.dashStyle = EzServerClient.Util.isArray(options.dashArray) ?
				    options.dashArray.join(' ') :
				    options.dashArray.replace(/( *, *)/g, ' ');
			} else {
				stroke.dashStyle = '';
			}
			if (options.lineCap) {
				stroke.endcap = options.lineCap.replace('butt', 'flat');
			}
			if (options.lineJoin) {
				stroke.joinstyle = options.lineJoin;
			}

		} else if (stroke) {
			container.removeChild(stroke);
			this._stroke = null;
		}

		if (options.fill) {
			if (!fill) {
				fill = this._fill = this._createElement('fill');
				container.appendChild(fill);
			}
			fill.color = options.fillColor || options.color;
			fill.opacity = options.fillOpacity;

		} else if (fill) {
			container.removeChild(fill);
			this._fill = null;
		}
	},

	_updatePath: function () {
		var style = this._container.style;

		style.display = 'none';
		this._path.v = this.getPathString() + ' '; // the space fixes IE empty path string bug
		style.display = '';
	}
});

EzServerClient.Map.include(EzServerClient.Browser.svg || !EzServerClient.Browser.vml ? {} : {
	_initPathRoot: function () {
		if (this._pathRoot) { return; }

		var root = this._pathRoot = document.createElement('div');
		root.className = 'leaflet-vml-container';
		this._panes.overlayPane.appendChild(root);

		this.on('moveend', this._updatePathViewport);
		this._updatePathViewport();
	}
});


/*
 * Vector rendering for all browsers that support canvas.
 */

EzServerClient.Browser.canvas = (function () {
	return !!document.createElement('canvas').getContext;
}());

EzServerClient.Path = (EzServerClient.Path.SVG && !window.EzServerClient_PREFER_CANVAS) || !EzServerClient.Browser.canvas ? EzServerClient.Path : EzServerClient.Path.extend({
	statics: {
		//CLIP_PADDING: 0.02, // not sure if there's a need to set it to a small value
		CANVAS: true,
		SVG: false
	},

	redraw: function () {
		if (this._map) {
			this.projectLatlngs();
			this._requestUpdate();
		}
		return this;
	},

	setStyle: function (style) {
		EzServerClient.setOptions(this, style);

		if (this._map) {
			this._updateStyle();
			this._requestUpdate();
		}
		return this;
	},

	onRemove: function (map) {
		map
		    .off('viewreset', this.projectLatlngs, this)
		    .off('moveend', this._updatePath, this);

		if (this.options.clickable) {
			this._map.off('click', this._onClick, this);
			this._map.off('mousemove', this._onMouseMove, this);
		}

		this._requestUpdate();
		
		this.fire('remove');
		this._map = null;
	},

	_requestUpdate: function () {
		if (this._map && !EzServerClient.Path._updateRequest) {
			EzServerClient.Path._updateRequest = EzServerClient.Util.requestAnimFrame(this._fireMapMoveEnd, this._map);
		}
	},

	_fireMapMoveEnd: function () {
		EzServerClient.Path._updateRequest = null;
		this.fire('moveend');
	},

	_initElements: function () {
		this._map._initPathRoot();
		this._ctx = this._map._canvasCtx;
	},

	_updateStyle: function () {
		var options = this.options;

		if (options.stroke) {
			this._ctx.lineWidth = options.weight;
			this._ctx.strokeStyle = options.color;
		}
		if (options.fill) {
			this._ctx.fillStyle = options.fillColor || options.color;
		}
	},

	_drawPath: function () {
		var i, j, len, len2, point, drawMethod;

		this._ctx.beginPath();

		for (i = 0, len = this._parts.length; i < len; i++) {
			for (j = 0, len2 = this._parts[i].length; j < len2; j++) {
				point = this._parts[i][j];
				drawMethod = (j === 0 ? 'move' : 'line') + 'To';

				this._ctx[drawMethod](point.x, point.y);
			}
			// TODO refactor ugly hack
			if (this instanceof EzServerClient.Polygon) {
				this._ctx.closePath();
			}
		}
	},

	_checkIfEmpty: function () {
		return !this._parts.length;
	},

	_updatePath: function () {
		if (this._checkIfEmpty()) { return; }

		var ctx = this._ctx,
		    options = this.options;

		this._drawPath();
		ctx.save();
		this._updateStyle();

		if (options.fill) {
			ctx.globalAlpha = options.fillOpacity;
			ctx.fill();
		}

		if (options.stroke) {
			ctx.globalAlpha = options.opacity;
			ctx.stroke();
		}

		ctx.restore();

		// TODO optimization: 1 fill/stroke for all features with equal style instead of 1 for each feature
	},

	_initEvents: function () {
		if (this.options.clickable) {
			// TODO dblclick
			this._map.on('mousemove', this._onMouseMove, this);
			this._map.on('click', this._onClick, this);
		}
	},

	_onClick: function (e) {
		if (this._containsPoint(e.layerPoint)) {
			this.fire('click', e);
		}
	},

	_onMouseMove: function (e) {
		if (!this._map || this._map._animatingZoom) { return; }

		// TODO don't do on each move
		if (this._containsPoint(e.layerPoint)) {
			this._ctx.canvas.style.cursor = 'pointer';
			this._mouseInside = true;
			this.fire('mouseover', e);

		} else if (this._mouseInside) {
			this._ctx.canvas.style.cursor = '';
			this._mouseInside = false;
			this.fire('mouseout', e);
		}
	}
});

EzServerClient.Map.include((EzServerClient.Path.SVG && !window.EzServerClient_PREFER_CANVAS) || !EzServerClient.Browser.canvas ? {} : {
	_initPathRoot: function () {
		var root = this._pathRoot,
		    ctx;

		if (!root) {
			root = this._pathRoot = document.createElement('canvas');
			root.style.position = 'absolute';
			ctx = this._canvasCtx = root.getContext('2d');

			ctx.lineCap = 'round';
			ctx.lineJoin = 'round';

			this._panes.overlayPane.appendChild(root);

			if (this.options.zoomAnimation) {
				this._pathRoot.className = 'leaflet-zoom-animated';
				this.on('zoomanim', this._animatePathZoom);
				this.on('zoomend', this._endPathZoom);
			}
			this.on('moveend', this._updateCanvasViewport);
			this._updateCanvasViewport();
		}
	},

	_updateCanvasViewport: function () {
		// don't redraw while zooming. See _updateSvgViewport for more details
		if (this._pathZooming) { return; }
		this._updatePathViewport();

		var vp = this._pathViewport,
		    min = vp.min,
		    size = vp.max.subtract(min),
		    root = this._pathRoot;

		//TODO check if this works properly on mobile webkit
		EzServerClient.DomUtil.setPosition(root, min);
		root.width = size.x;
		root.height = size.y;
		root.getContext('2d').translate(-min.x, -min.y);
	}
});


/*
 * EzServerClient.LineUtil contains different utility functions for line segments
 * and polylines (clipping, simplification, distances, etc.)
 */

/*jshint bitwise:false */ // allow bitwise operations for this file

EzServerClient.LineUtil = {

	// Simplify polyline with vertex reduction and Douglas-Peucker simplification.
	// Improves rendering performance dramatically by lessening the number of points to draw.

	simplify: function (/*Point[]*/ points, /*Number*/ tolerance) {
		if (!tolerance || !points.length) {
			return points.slice();
		}

		var sqTolerance = tolerance * tolerance;

		// stage 1: vertex reduction
		points = this._reducePoints(points, sqTolerance);

		// stage 2: Douglas-Peucker simplification
		points = this._simplifyDP(points, sqTolerance);

		return points;
	},

	// distance from a point to a segment between two points
	pointToSegmentDistance:  function (/*Point*/ p, /*Point*/ p1, /*Point*/ p2) {
		return Math.sqrt(this._sqClosestPointOnSegment(p, p1, p2, true));
	},

	closestPointOnSegment: function (/*Point*/ p, /*Point*/ p1, /*Point*/ p2) {
		return this._sqClosestPointOnSegment(p, p1, p2);
	},

	// Douglas-Peucker simplification, see http://en.wikipedia.org/wiki/Douglas-Peucker_algorithm
	_simplifyDP: function (points, sqTolerance) {

		var len = points.length,
		    ArrayConstructor = typeof Uint8Array !== undefined + '' ? Uint8Array : Array,
		    markers = new ArrayConstructor(len);

		markers[0] = markers[len - 1] = 1;

		this._simplifyDPStep(points, markers, sqTolerance, 0, len - 1);

		var i,
		    newPoints = [];

		for (i = 0; i < len; i++) {
			if (markers[i]) {
				newPoints.push(points[i]);
			}
		}

		return newPoints;
	},

	_simplifyDPStep: function (points, markers, sqTolerance, first, last) {

		var maxSqDist = 0,
		    index, i, sqDist;

		for (i = first + 1; i <= last - 1; i++) {
			sqDist = this._sqClosestPointOnSegment(points[i], points[first], points[last], true);

			if (sqDist > maxSqDist) {
				index = i;
				maxSqDist = sqDist;
			}
		}

		if (maxSqDist > sqTolerance) {
			markers[index] = 1;

			this._simplifyDPStep(points, markers, sqTolerance, first, index);
			this._simplifyDPStep(points, markers, sqTolerance, index, last);
		}
	},

	// reduce points that are too close to each other to a single point
	_reducePoints: function (points, sqTolerance) {
		var reducedPoints = [points[0]];

		for (var i = 1, prev = 0, len = points.length; i < len; i++) {
			if (this._sqDist(points[i], points[prev]) > sqTolerance) {
				reducedPoints.push(points[i]);
				prev = i;
			}
		}
		if (prev < len - 1) {
			reducedPoints.push(points[len - 1]);
		}
		return reducedPoints;
	},

	// Cohen-Sutherland line clipping algorithm.
	// Used to avoid rendering parts of a polyline that are not currently visible.

	clipSegment: function (a, b, bounds, useLastCode) {
		var codeA = useLastCode ? this._lastCode : this._getBitCode(a, bounds),
		    codeB = this._getBitCode(b, bounds),

		    codeOut, p, newCode;

		// save 2nd code to avoid calculating it on the next segment
		this._lastCode = codeB;

		while (true) {
			// if a,b is inside the clip window (trivial accept)
			if (!(codeA | codeB)) {
				return [a, b];
			// if a,b is outside the clip window (trivial reject)
			} else if (codeA & codeB) {
				return false;
			// other cases
			} else {
				codeOut = codeA || codeB;
				p = this._getEdgeIntersection(a, b, codeOut, bounds);
				newCode = this._getBitCode(p, bounds);

				if (codeOut === codeA) {
					a = p;
					codeA = newCode;
				} else {
					b = p;
					codeB = newCode;
				}
			}
		}
	},

	_getEdgeIntersection: function (a, b, code, bounds) {
		var dx = b.x - a.x,
		    dy = b.y - a.y,
		    min = bounds.min,
		    max = bounds.max;

		if (code & 8) { // top
			return new EzServerClient.Point(a.x + dx * (max.y - a.y) / dy, max.y);
		} else if (code & 4) { // bottom
			return new EzServerClient.Point(a.x + dx * (min.y - a.y) / dy, min.y);
		} else if (code & 2) { // right
			return new EzServerClient.Point(max.x, a.y + dy * (max.x - a.x) / dx);
		} else if (code & 1) { // left
			return new EzServerClient.Point(min.x, a.y + dy * (min.x - a.x) / dx);
		}
	},

	_getBitCode: function (/*Point*/ p, bounds) {
		var code = 0;

		if (p.x < bounds.min.x) { // left
			code |= 1;
		} else if (p.x > bounds.max.x) { // right
			code |= 2;
		}
		if (p.y < bounds.min.y) { // bottom
			code |= 4;
		} else if (p.y > bounds.max.y) { // top
			code |= 8;
		}

		return code;
	},

	// square distance (to avoid unnecessary Math.sqrt calls)
	_sqDist: function (p1, p2) {
		var dx = p2.x - p1.x,
		    dy = p2.y - p1.y;
		return dx * dx + dy * dy;
	},

	// return closest point on segment or distance to that point
	_sqClosestPointOnSegment: function (p, p1, p2, sqDist) {
		var x = p1.x,
		    y = p1.y,
		    dx = p2.x - x,
		    dy = p2.y - y,
		    dot = dx * dx + dy * dy,
		    t;

		if (dot > 0) {
			t = ((p.x - x) * dx + (p.y - y) * dy) / dot;

			if (t > 1) {
				x = p2.x;
				y = p2.y;
			} else if (t > 0) {
				x += dx * t;
				y += dy * t;
			}
		}

		dx = p.x - x;
		dy = p.y - y;

		return sqDist ? dx * dx + dy * dy : new EzServerClient.Point(x, y);
	}
};


/*
 * EzServerClient.Polyline is used to display polylines on a map.
 */

EzServerClient.Polyline = EzServerClient.Path.extend({
	initialize: function (latlngs, options) {
		EzServerClient.Path.prototype.initialize.call(this, options);

		this._latlngs = this._convertLatLngs(latlngs);
	},

	options: {
		// how much to simplify the polyline on each zoom level
		// more = better performance and smoother look, less = more accurate
		smoothFactor: 1.0,
		noClip: false
	},

	projectLatlngs: function () {
		this._originalPoints = [];

		for (var i = 0, len = this._latlngs.length; i < len; i++) {
			this._originalPoints[i] = this._map.latLngToLayerPoint(this._latlngs[i]);
		}
	},

	getPathString: function () {
		for (var i = 0, len = this._parts.length, str = ''; i < len; i++) {
			str += this._getPathPartStr(this._parts[i]);
		}
		return str;
	},

	getLatLngs: function () {
		return this._latlngs;
	},

	setLatLngs: function (latlngs) {
		this._latlngs = this._convertLatLngs(latlngs);
		return this.redraw();
	},

	addLatLng: function (latlng) {
		this._latlngs.push(EzServerClient.latLng(latlng));
		return this.redraw();
	},

	spliceLatLngs: function () { // (Number index, Number howMany)
		var removed = [].splice.apply(this._latlngs, arguments);
		this._convertLatLngs(this._latlngs, true);
		this.redraw();
		return removed;
	},

	closestLayerPoint: function (p) {
		var minDistance = Infinity, parts = this._parts, p1, p2, minPoint = null;

		for (var j = 0, jLen = parts.length; j < jLen; j++) {
			var points = parts[j];
			for (var i = 1, len = points.length; i < len; i++) {
				p1 = points[i - 1];
				p2 = points[i];
				var sqDist = EzServerClient.LineUtil._sqClosestPointOnSegment(p, p1, p2, true);
				if (sqDist < minDistance) {
					minDistance = sqDist;
					minPoint = EzServerClient.LineUtil._sqClosestPointOnSegment(p, p1, p2);
				}
			}
		}
		if (minPoint) {
			minPoint.distance = Math.sqrt(minDistance);
		}
		return minPoint;
	},

	getBounds: function () {
		return new EzServerClient.LatLngBounds(this.getLatLngs());
	},

	_convertLatLngs: function (latlngs, overwrite) {
		var i, len, target = overwrite ? latlngs : [];

		for (i = 0, len = latlngs.length; i < len; i++) {
			if (EzServerClient.Util.isArray(latlngs[i]) && typeof latlngs[i][0] !== 'number') {
				return;
			}
			target[i] = EzServerClient.latLng(latlngs[i]);
		}
		return target;
	},

	_initEvents: function () {
		EzServerClient.Path.prototype._initEvents.call(this);
	},

	_getPathPartStr: function (points) {
		var round = EzServerClient.Path.VML;

		for (var j = 0, len2 = points.length, str = '', p; j < len2; j++) {
			p = points[j];
			if (round) {
				p._round();
			}
			str += (j ? 'L' : 'M') + p.x + ' ' + p.y;
		}
		return str;
	},

	_clipPoints: function () {
		var points = this._originalPoints,
		    len = points.length,
		    i, k, segment;

		if (this.options.noClip) {
			this._parts = [points];
			return;
		}

		this._parts = [];

		var parts = this._parts,
		    vp = this._map._pathViewport,
		    lu = EzServerClient.LineUtil;

		for (i = 0, k = 0; i < len - 1; i++) {
			segment = lu.clipSegment(points[i], points[i + 1], vp, i);
			if (!segment) {
				continue;
			}

			parts[k] = parts[k] || [];
			parts[k].push(segment[0]);

			// if segment goes out of screen, or it's the last one, it's the end of the line part
			if ((segment[1] !== points[i + 1]) || (i === len - 2)) {
				parts[k].push(segment[1]);
				k++;
			}
		}
	},

	// simplify each clipped part of the polyline
	_simplifyPoints: function () {
		var parts = this._parts,
		    lu = EzServerClient.LineUtil;

		for (var i = 0, len = parts.length; i < len; i++) {
			parts[i] = lu.simplify(parts[i], this.options.smoothFactor);
		}
	},

	_updatePath: function () {
		if (!this._map) { return; }

		this._clipPoints();
		this._simplifyPoints();

		EzServerClient.Path.prototype._updatePath.call(this);
	},

	clone:function(){
		return new EzServerClient.Polyline(this._latlngs,this.options);
	}
});

EzServerClient.polyline = function (latlngs, options) {
	return new EzServerClient.Polyline(latlngs, options);
};


/*
 * EzServerClient.PolyUtil contains utility functions for polygons (clipping, etc.).
 */

/*jshint bitwise:false */ // allow bitwise operations here

EzServerClient.PolyUtil = {};

/*
 * Sutherland-Hodgeman polygon clipping algorithm.
 * Used to avoid rendering parts of a polygon that are not currently visible.
 */
EzServerClient.PolyUtil.clipPolygon = function (points, bounds) {
	var clippedPoints,
	    edges = [1, 4, 2, 8],
	    i, j, k,
	    a, b,
	    len, edge, p,
	    lu = EzServerClient.LineUtil;

	for (i = 0, len = points.length; i < len; i++) {
		points[i]._code = lu._getBitCode(points[i], bounds);
	}

	// for each edge (left, bottom, right, top)
	for (k = 0; k < 4; k++) {
		edge = edges[k];
		clippedPoints = [];

		for (i = 0, len = points.length, j = len - 1; i < len; j = i++) {
			a = points[i];
			b = points[j];

			// if a is inside the clip window
			if (!(a._code & edge)) {
				// if b is outside the clip window (a->b goes out of screen)
				if (b._code & edge) {
					p = lu._getEdgeIntersection(b, a, edge, bounds);
					p._code = lu._getBitCode(p, bounds);
					clippedPoints.push(p);
				}
				clippedPoints.push(a);

			// else if b is inside the clip window (a->b enters the screen)
			} else if (!(b._code & edge)) {
				p = lu._getEdgeIntersection(b, a, edge, bounds);
				p._code = lu._getBitCode(p, bounds);
				clippedPoints.push(p);
			}
		}
		points = clippedPoints;
	}

	return points;
};


/*
 * EzServerClient.Polygon is used to display polygons on a map.
 */

EzServerClient.Polygon = EzServerClient.Polyline.extend({
	options: {
		fill: true
	},

	initialize: function (latlngs, options) {
		EzServerClient.Polyline.prototype.initialize.call(this, latlngs, options);
		this._initWithHoles(latlngs);
	},

	_initWithHoles: function (latlngs) {
		var i, len, hole;
		if (latlngs && EzServerClient.Util.isArray(latlngs[0]) && (typeof latlngs[0][0] !== 'number')) {
			this._latlngs = this._convertLatLngs(latlngs[0]);
			this._holes = latlngs.slice(1);

			for (i = 0, len = this._holes.length; i < len; i++) {
				hole = this._holes[i] = this._convertLatLngs(this._holes[i]);
				if (hole[0].equals(hole[hole.length - 1])) {
					hole.pop();
				}
			}
		}

		// filter out last point if its equal to the first one
		latlngs = this._latlngs;

		if (latlngs.length >= 2 && latlngs[0].equals(latlngs[latlngs.length - 1])) {
			latlngs.pop();
		}
	},

	projectLatlngs: function () {
		EzServerClient.Polyline.prototype.projectLatlngs.call(this);

		// project polygon holes points
		// TODO move this logic to Polyline to get rid of duplication
		this._holePoints = [];

		if (!this._holes) { return; }

		var i, j, len, len2;

		for (i = 0, len = this._holes.length; i < len; i++) {
			this._holePoints[i] = [];

			for (j = 0, len2 = this._holes[i].length; j < len2; j++) {
				this._holePoints[i][j] = this._map.latLngToLayerPoint(this._holes[i][j]);
			}
		}
	},

	setLatLngs: function (latlngs) {
		if (latlngs && EzServerClient.Util.isArray(latlngs[0]) && (typeof latlngs[0][0] !== 'number')) {
			this._initWithHoles(latlngs);
			return this.redraw();
		} else {
			return EzServerClient.Polyline.prototype.setLatLngs.call(this, latlngs);
		}
	},

	_clipPoints: function () {
		var points = this._originalPoints,
		    newParts = [];

		this._parts = [points].concat(this._holePoints);

		if (this.options.noClip) { return; }

		for (var i = 0, len = this._parts.length; i < len; i++) {
			var clipped = EzServerClient.PolyUtil.clipPolygon(this._parts[i], this._map._pathViewport);
			if (clipped.length) {
				newParts.push(clipped);
			}
		}

		this._parts = newParts;
	},

	_getPathPartStr: function (points) {
		var str = EzServerClient.Polyline.prototype._getPathPartStr.call(this, points);
		return str + (EzServerClient.Browser.svg ? 'z' : 'x');
	}
});

EzServerClient.polygon = function (latlngs, options) {
	return new EzServerClient.Polygon(latlngs, options);
};


/*
 * Contains EzServerClient.MultiPolyline and EzServerClient.MultiPolygon layers.
 */

(function () {
	function createMulti(Klass) {

		return EzServerClient.FeatureGroup.extend({

			initialize: function (latlngs, options) {
				this._layers = {};
				this._options = options;
				this.setLatLngs(latlngs);
			},

			setLatLngs: function (latlngs) {
				var i = 0,
				    len = latlngs.length;

				this.eachLayer(function (layer) {
					if (i < len) {
						layer.setLatLngs(latlngs[i++]);
					} else {
						this.removeLayer(layer);
					}
				}, this);

				while (i < len) {
					this.addLayer(new Klass(latlngs[i++], this._options));
				}

				return this;
			},

			getLatLngs: function () {
				var latlngs = [];

				this.eachLayer(function (layer) {
					latlngs.push(layer.getLatLngs());
				});

				return latlngs;
			}
		});
	}

	EzServerClient.MultiPolyline = createMulti(EzServerClient.Polyline);
	EzServerClient.MultiPolygon = createMulti(EzServerClient.Polygon);

	EzServerClient.multiPolyline = function (latlngs, options) {
		return new EzServerClient.MultiPolyline(latlngs, options);
	};

	EzServerClient.multiPolygon = function (latlngs, options) {
		return new EzServerClient.MultiPolygon(latlngs, options);
	};
}());


/*
 * EzServerClient.Rectangle extends Polygon and creates a rectangle when passed a LatLngBounds object.
 */

EzServerClient.Rectangle = EzServerClient.Polygon.extend({
	initialize: function (latLngBounds, options) {
		EzServerClient.Polygon.prototype.initialize.call(this, this._boundsToLatLngs(latLngBounds), options);
	},

	setBounds: function (latLngBounds) {
		this.setLatLngs(this._boundsToLatLngs(latLngBounds));
	},

	_boundsToLatLngs: function (latLngBounds) {
		latLngBounds = EzServerClient.latLngBounds(latLngBounds);
		return [
			latLngBounds.getSouthWest(),
			latLngBounds.getNorthWest(),
			latLngBounds.getNorthEast(),
			latLngBounds.getSouthEast()
		];
	}
});

EzServerClient.rectangle = function (latLngBounds, options) {
	return new EzServerClient.Rectangle(latLngBounds, options);
};


/*
 * EzServerClient.Circle is a circle overlay (with a certain radius in meters).
 */

EzServerClient.Circle = EzServerClient.Path.extend({
	initialize: function (latlng, radius, options) {
		EzServerClient.Path.prototype.initialize.call(this, options);

		this._latlng = EzServerClient.latLng(latlng);
		this._mRadius = radius;
	},

	options: {
		fill: true
	},

	setLatLng: function (latlng) {
		this._latlng = EzServerClient.latLng(latlng);
		return this.redraw();
	},

	setRadius: function (radius) {
		this._mRadius = radius;
		return this.redraw();
	},

	projectLatlngs: function () {
		var lngRadius = this._getLngRadius(),
		    latlng = this._latlng,
		    pointLeft = this._map.latLngToLayerPoint([latlng.lat, latlng.lng - lngRadius]);

		this._point = this._map.latLngToLayerPoint(latlng);
		this._radius = Math.max(this._point.x - pointLeft.x, 1);
	},

	getBounds: function () {
		var lngRadius = this._getLngRadius(),
		    latRadius = (this._mRadius / 40075017) * 360,
		    latlng = this._latlng;

		return new EzServerClient.LatLngBounds(
		        [latlng.lat - latRadius, latlng.lng - lngRadius],
		        [latlng.lat + latRadius, latlng.lng + lngRadius]);
	},

	getLatLng: function () {
		return this._latlng;
	},

	getPathString: function () {
		var p = this._point,
		    r = this._radius;

		if (this._checkIfEmpty()) {
			return '';
		}

		if (EzServerClient.Browser.svg) {
			return 'M' + p.x + ',' + (p.y - r) +
			       'A' + r + ',' + r + ',0,1,1,' +
			       (p.x - 0.1) + ',' + (p.y - r) + ' z';
		} else {
			p._round();
			r = Math.round(r);
			return 'AL ' + p.x + ',' + p.y + ' ' + r + ',' + r + ' 0,' + (65535 * 360);
		}
	},

	getRadius: function () {
		return this._mRadius;
	},

	// TODO Earth hardcoded, move into projection code!

	_getLatRadius: function () {
		return (this._mRadius / 40075017) * 360;
	},

	_getLngRadius: function () {
		return this._getLatRadius() / Math.cos(EzServerClient.LatLng.DEG_TO_RAD * this._latlng.lat);
	},

	_checkIfEmpty: function () {
		if (!this._map) {
			return false;
		}
		var vp = this._map._pathViewport,
		    r = this._radius,
		    p = this._point;

		return p.x - r > vp.max.x || p.y - r > vp.max.y ||
		       p.x + r < vp.min.x || p.y + r < vp.min.y;
	},
	
	clone:function(){
		return EzServerClient.circle(this.getLatLng(), this.getRadius(), this.options)
	}
});

EzServerClient.circle = function (latlng, radius, options) {
	return new EzServerClient.Circle(latlng, radius, options);
};


/*
 * EzServerClient.GpsMonitoring is a GPS overlay (with a certain radius in meters).
 */

EzServerClient.GpsMonitoring = EzServerClient.Path.extend({
	initialize: function (latlng, radius, options) {
		EzServerClient.Path.prototype.initialize.call(this, options);

		this._latlng = EzServerClient.latLng(latlng);
		this._mRadius = radius;
	},

	options: {
		fill: true
	},

	setLatLng: function (latlng) {
		this._latlng = EzServerClient.latLng(latlng);
		return this.redraw();
	},

	setRadius: function (radius) {
		this._mRadius = radius;
		return this.redraw();
	},

	projectLatlngs: function () {
		var lngRadius = this._getLngRadius(),
		    latlng = this._latlng,
		    pointLeft = this._map.latLngToLayerPoint([latlng.lat, latlng.lng - lngRadius]);

		this._point = this._map.latLngToLayerPoint(latlng);
		this._radius = Math.max(this._point.x - pointLeft.x, 1);
	},

	getBounds: function () {
		var lngRadius = this._getLngRadius(),
		    latRadius = (this._mRadius / 40075017) * 360,
		    latlng = this._latlng;

		return new EzServerClient.LatLngBounds(
		        [latlng.lat - latRadius, latlng.lng - lngRadius],
		        [latlng.lat + latRadius, latlng.lng + lngRadius]);
	},

	getLatLng: function () {
		return this._latlng;
	},

	getPathString: function () {
		var p = this._point,
		    r = this._radius;

		if (this._checkIfEmpty()) {
			return '';
		}

		if (EzServerClient.Browser.svg) {
			return 'M' + p.x + ',' + (p.y - r) +
			       'A' + r + ',' + r + ',0,1,1,' +
			       (p.x - 0.1) + ',' + (p.y - r) + ' z';
		} else {
			p._round();
			r = Math.round(r);
			return 'AL ' + p.x + ',' + p.y + ' ' + r + ',' + r + ' 0,' + (65535 * 360);
		}
	},

	getRadius: function () {
		return this._mRadius;
	},

	// TODO Earth hardcoded, move into projection code!

	_getLatRadius: function () {
		return (this._mRadius / 40075017) * 360;
	},

	_getLngRadius: function () {
		return this._getLatRadius() / Math.cos(EzServerClient.LatLng.DEG_TO_RAD * this._latlng.lat);
	},

	_checkIfEmpty: function () {
		if (!this._map) {
			return false;
		}
		var vp = this._map._pathViewport,
		    r = this._radius,
		    p = this._point;

		return p.x - r > vp.max.x || p.y - r > vp.max.y ||
		       p.x + r < vp.min.x || p.y + r < vp.min.y;
	}
});

EzServerClient.GPS = function (latlng, radius, options) {
	return new EzServerClient.GpsMonitoring(latlng, radius, options);
};


/*
 * EzServerClient.CircleMarker is a circle overlay with a permanent pixel radius.
 */

EzServerClient.CircleMarker = EzServerClient.Circle.extend({
	options: {
		radius: 10,
		weight: 2
	},

	initialize: function (latlng, options) {
		EzServerClient.Circle.prototype.initialize.call(this, latlng, null, options);
		this._radius = this.options.radius;
	},

	projectLatlngs: function () {
		this._point = this._map.latLngToLayerPoint(this._latlng);
	},

	_updateStyle : function () {
		EzServerClient.Circle.prototype._updateStyle.call(this);
		this.setRadius(this.options.radius);
	},

	setLatLng: function (latlng) {
		EzServerClient.Circle.prototype.setLatLng.call(this, latlng);
		if (this._popup && this._popup._isOpen) {
			this._popup.setLatLng(latlng);
		}
		return this;
	},

	setRadius: function (radius) {
		this.options.radius = this._radius = radius;
		return this.redraw();
	},

	getRadius: function () {
		return this._radius;
	}
});

EzServerClient.circleMarker = function (latlng, options) {
	return new EzServerClient.CircleMarker(latlng, options);
};



EzServerClient.Label = EzServerClient.Class.extend({

	includes: EzServerClient.Mixin.Events,

	options: {
		className: '',
		clickable: false,
		direction: 'right',
		noHide: false,
		offset: [12, -15], // 6 (width of the label triangle) + 6 (padding)
		opacity: 1,
		zoomAnimation: true
	},

	initialize: function (options, source) {
		EzServerClient.setOptions(this, options);

		this._source = source;
		this._animated = EzServerClient.Browser.any3d && this.options.zoomAnimation;
		this._isOpen = false;
	},

	onAdd: function (map) {
		this._map = map;

		this._pane = this.options.pane ? map._panes[this.options.pane] :
			this._source instanceof EzServerClient.Marker ? map._panes.markerPane : map._panes.popupPane;

		if (!this._container) {
			this._initLayout();
		}

		this._pane.appendChild(this._container);

		this._initInteraction();

		this._update();

		this.setOpacity(this.options.opacity);

		map
			.on('moveend', this._onMoveEnd, this)
			.on('viewreset', this._onViewReset, this);

		if (this._animated) {
			map.on('zoomanim', this._zoomAnimation, this);
		}

		if (EzServerClient.Browser.touch && !this.options.noHide) {
			EzServerClient.DomEvent.on(this._container, 'click', this.close, this);
			map.on('click', this.close, this);
		}
	},

	onRemove: function (map) {
		this._pane.removeChild(this._container);

		map.off({
			zoomanim: this._zoomAnimation,
			moveend: this._onMoveEnd,
			viewreset: this._onViewReset
		}, this);

		this._removeInteraction();

		this._map = null;
	},

	setLatLng: function (latlng) {
		this._latlng = EzServerClient.latLng(latlng);
		if (this._map) {
			this._updatePosition();
		}
		return this;
	},

	setContent: function (content) {
		// Backup previous content and store new content
		this._previousContent = this._content;
		this._content = content;

		this._updateContent();

		return this;
	},

	close: function () {
		var map = this._map;

		if (map) {
			if (EzServerClient.Browser.touch && !this.options.noHide) {
				EzServerClient.DomEvent.off(this._container, 'click', this.close);
				map.off('click', this.close, this);
			}

			map.removeLayer(this);
		}
	},

	updateZIndex: function (zIndex) {
		this._zIndex = zIndex;

		if (this._container && this._zIndex) {
			this._container.style.zIndex = zIndex;
		}
	},

	setOpacity: function (opacity) {
		this.options.opacity = opacity;

		if (this._container) {
			EzServerClient.DomUtil.setOpacity(this._container, opacity);
		}
	},

	_initLayout: function () {
		this._container = EzServerClient.DomUtil.create('div', 'leaflet-label ' + this.options.className + ' leaflet-zoom-animated');
		this.updateZIndex(this._zIndex);
	},

	_update: function () {
		if (!this._map) { return; }

		this._container.style.visibility = 'hidden';

		this._updateContent();
		this._updatePosition();

		this._container.style.visibility = '';
	},

	_updateContent: function () {
		if (!this._content || !this._map || this._prevContent === this._content) {
			return;
		}

		if (typeof this._content === 'string') {
			this._container.innerHTML = this._content;

			this._prevContent = this._content;

			this._labelWidth = this._container.offsetWidth;
		}
	},

	_updatePosition: function () {
		var pos = this._map.latLngToLayerPoint(this._latlng);

		this._setPosition(pos);
	},

	_setPosition: function (pos) {
		var map = this._map,
			container = this._container,
			centerPoint = map.latLngToContainerPoint(map.getCenter()),
			labelPoint = map.layerPointToContainerPoint(pos),
			direction = this.options.direction,
			labelWidth = this._labelWidth,
			offset = EzServerClient.point(this.options.offset);

		// position to the right (right or auto & needs to)
		if (direction === 'right' || direction === 'auto' && labelPoint.x < centerPoint.x) {
			EzServerClient.DomUtil.addClass(container, 'leaflet-label-right');
			EzServerClient.DomUtil.removeClass(container, 'leaflet-label-left');

			pos = pos.add(offset);
		} else { // position to the left
			EzServerClient.DomUtil.addClass(container, 'leaflet-label-left');
			EzServerClient.DomUtil.removeClass(container, 'leaflet-label-right');

			pos = pos.add(EzServerClient.point(-offset.x - labelWidth, offset.y));
		}

		EzServerClient.DomUtil.setPosition(container, pos);
	},

	_zoomAnimation: function (opt) {
		var pos = this._map._latLngToNewLayerPoint(this._latlng, opt.zoom, opt.center).round();

		this._setPosition(pos);
	},

	_onMoveEnd: function () {
		if (!this._animated || this.options.direction === 'auto') {
			this._updatePosition();
		}
	},

	_onViewReset: function (e) {
		/* if map resets hard, we must update the label */
		if (e && e.hard) {
			this._update();
		}
	},

	_initInteraction: function () {
		if (!this.options.clickable) { return; }

		var container = this._container,
			events = ['dblclick', 'mousedown', 'mouseover', 'mouseout', 'contextmenu'];

		EzServerClient.DomUtil.addClass(container, 'leaflet-clickable');
		EzServerClient.DomEvent.on(container, 'click', this._onMouseClick, this);

		for (var i = 0; i < events.length; i++) {
			EzServerClient.DomEvent.on(container, events[i], this._fireMouseEvent, this);
		}
	},

	_removeInteraction: function () {
		if (!this.options.clickable) { return; }

		var container = this._container,
			events = ['dblclick', 'mousedown', 'mouseover', 'mouseout', 'contextmenu'];

		EzServerClient.DomUtil.removeClass(container, 'leaflet-clickable');
		EzServerClient.DomEvent.off(container, 'click', this._onMouseClick, this);

		for (var i = 0; i < events.length; i++) {
			EzServerClient.DomEvent.off(container, events[i], this._fireMouseEvent, this);
		}
	},

	_onMouseClick: function (e) {
		if (this.hasEventListeners(e.type)) {
			EzServerClient.DomEvent.stopPropagation(e);
		}

		this.fire(e.type, {
			originalEvent: e
		});
	},

	_fireMouseEvent: function (e) {
		this.fire(e.type, {
			originalEvent: e
		});

		// TODO proper custom event propagation
		// this line will always be called if marker is in a FeatureGroup
		if (e.type === 'contextmenu' && this.hasEventListeners(e.type)) {
			EzServerClient.DomEvent.preventDefault(e);
		}
		if (e.type !== 'mousedown') {
			EzServerClient.DomEvent.stopPropagation(e);
		} else {
			EzServerClient.DomEvent.preventDefault(e);
		}
	}
});


// This object is a mixin for EzServerClient.Marker and EzServerClient.CircleMarker. We declare it here as both need to include the contents.
EzServerClient.BaseMarkerMethods = {
	showLabel: function () {
		if (this.label && this._map) {
			this.label.setLatLng(this._latlng);
			this._map.showLabel(this.label);
		}

		return this;
	},

	hideLabel: function () {
		if (this.label) {
			this.label.close();
		}
		return this;
	},

	setLabelNoHide: function (noHide) {
		if (this._labelNoHide === noHide) {
			return;
		}

		this._labelNoHide = noHide;

		if (noHide) {
			this._removeLabelRevealHandlers();
			this.showLabel();
		} else {
			this._addLabelRevealHandlers();
			this.hideLabel();
		}
	},

	bindLabel: function (content, options) {
		var labelAnchor = this.options.icon ? this.options.icon.options.labelAnchor : this.options.labelAnchor,
			anchor = EzServerClient.point(labelAnchor) || EzServerClient.point(0, 0);

		anchor = anchor.add(EzServerClient.Label.prototype.options.offset);

		if (options && options.offset) {
			anchor = anchor.add(options.offset);
		}

		options = EzServerClient.Util.extend({offset: anchor}, optiofns);

		this._labelNoHide = options.noHide;

		if (!this.label) {
			if (!this._labelNoHide) {
				this._addLabelRevealHandlers();
			}

			this
				.on('remove', this.hideLabel, this)
				.on('move', this._moveLabel, this)
				.on('add', this._onMarkerAdd, this);

			this._hasLabelHandlers = true;
		}

		this.label = new EzServerClient.Label(options, this)
			.setContent(content);

		return this;
	},

	unbindLabel: function () {
		if (this.label) {
			this.hideLabel();

			this.label = null;

			if (this._hasLabelHandlers) {
				if (!this._labelNoHide) {
					this._removeLabelRevealHandlers();
				}

				this
					.off('remove', this.hideLabel, this)
					.off('move', this._moveLabel, this)
					.off('add', this._onMarkerAdd, this);
			}

			this._hasLabelHandlers = false;
		}
		return this;
	},

	updateLabelContent: function (content) {
		if (this.label) {
			this.label.setContent(content);
		}
	},

	getLabel: function () {
		return this.label;
	},

	_onMarkerAdd: function () {
		if (this._labelNoHide) {
			this.showLabel();
		}
	},

	_addLabelRevealHandlers: function () {
		this
			.on('mouseover', this.showLabel, this)
			.on('mouseout', this.hideLabel, this);

		if (EzServerClient.Browser.touch) {
			this.on('click', this.showLabel, this);
		}
	},

	_removeLabelRevealHandlers: function () {
		this
			.off('mouseover', this.showLabel, this)
			.off('mouseout', this.hideLabel, this);

		if (EzServerClient.Browser.touch) {
			this.off('click', this.showLabel, this);
		}
	},

	_moveLabel: function (e) {
		this.label.setLatLng(e.latlng);
	}
};

// Add in an option to icon that is used to set where the label anchor is
EzServerClient.Icon.Default.mergeOptions({
	labelAnchor: new EzServerClient.Point(9, -20)
});

// Have to do this since Leaflet is loaded before this plugin and initializes
// EzServerClient.Marker.options.icon therefore missing our mixin above.
EzServerClient.Marker.mergeOptions({
	icon: new EzServerClient.Icon.Default()
});

EzServerClient.Marker.include(EzServerClient.BaseMarkerMethods);
EzServerClient.Marker.include({
	_originalUpdateZIndex: EzServerClient.Marker.prototype._updateZIndex,

	_updateZIndex: function (offset) {
		var zIndex = this._zIndex + offset;

		this._originalUpdateZIndex(offset);

		if (this.label) {
			this.label.updateZIndex(zIndex);
		}
	},

	_originalSetOpacity: EzServerClient.Marker.prototype.setOpacity,

	setOpacity: function (opacity, labelHasSemiTransparency) {
		this.options.labelHasSemiTransparency = labelHasSemiTransparency;

		this._originalSetOpacity(opacity);
	},

	_originalUpdateOpacity: EzServerClient.Marker.prototype._updateOpacity,

	_updateOpacity: function () {
		var absoluteOpacity = this.options.opacity === 0 ? 0 : 1;

		this._originalUpdateOpacity();

		if (this.label) {
			this.label.setOpacity(this.options.labelHasSemiTransparency ? this.options.opacity : absoluteOpacity);
		}
	},

	_originalSetLatLng: EzServerClient.Marker.prototype.setLatLng,

	setLatLng: function (latlng) {
		if (this.label && !this._labelNoHide) {
			this.hideLabel();
		}

		return this._originalSetLatLng(latlng);
	}
});

// Add in an option to icon that is used to set where the label anchor is
EzServerClient.CircleMarker.mergeOptions({
	labelAnchor: new EzServerClient.Point(0, 0)
});


EzServerClient.CircleMarker.include(EzServerClient.BaseMarkerMethods);

EzServerClient.Path.include({
	bindLabel: function (content, options) {
		if (!this.label || this.label.options !== options) {
			this.label = new EzServerClient.Label(options, this);
		}

		this.label.setContent(content);

		if (!this._showLabelAdded) {
			this
				.on('mouseover', this._showLabel, this)
				.on('mousemove', this._moveLabel, this)
				.on('mouseout remove', this._hideLabel, this);

			if (EzServerClient.Browser.touch) {
				this.on('click', this._showLabel, this);
			}
			this._showLabelAdded = true;
		}

		return this;
	},

	unbindLabel: function () {
		if (this.label) {
			this._hideLabel();
			this.label = null;
			this._showLabelAdded = false;
			this
				.off('mouseover', this._showLabel, this)
				.off('mousemove', this._moveLabel, this)
				.off('mouseout remove', this._hideLabel, this);
		}
		return this;
	},

	updateLabelContent: function (content) {
		if (this.label) {
			this.label.setContent(content);
		}
	},

	_showLabel: function (e) {
		this.label.setLatLng(e.latlng);
		this._map.showLabel(this.label);
	},

	_moveLabel: function (e) {
		this.label.setLatLng(e.latlng);
	},

	_hideLabel: function () {
		this.label.close();
	}
});

EzServerClient.Map.include({
	showLabel: function (label) {
		return this.addLayer(label);
	}
});

EzServerClient.FeatureGroup.include({
	// TODO: remove this when AOP is supported in Leaflet, need this as we cannot put code in removeLayer()
	clearLayers: function () {
		this.unbindLabel();
		this.eachLayer(this.removeLayer, this);
		return this;
	},

	bindLabel: function (content, options) {
		return this.invoke('bindLabel', content, options);
	},

	unbindLabel: function () {
		return this.invoke('unbindLabel');
	},

	updateLabelContent: function (content) {
		this.invoke('updateLabelContent', content);
	}
});

/*
 * Extends EzServerClient.Polyline to be able to manually detect clicks on Canvas-rendered polylines.
 */

EzServerClient.Polyline.include(!EzServerClient.Path.CANVAS ? {} : {
	_containsPoint: function (p, closed) {
		var i, j, k, len, len2, dist, part,
		    w = this.options.weight / 2;

		if (EzServerClient.Browser.touch) {
			w += 10; // polyline click tolerance on touch devices
		}

		for (i = 0, len = this._parts.length; i < len; i++) {
			part = this._parts[i];
			for (j = 0, len2 = part.length, k = len2 - 1; j < len2; k = j++) {
				if (!closed && (j === 0)) {
					continue;
				}

				dist = EzServerClient.LineUtil.pointToSegmentDistance(p, part[k], part[j]);

				if (dist <= w) {
					return true;
				}
			}
		}
		return false;
	}
});


/*
 * Extends EzServerClient.Polygon to be able to manually detect clicks on Canvas-rendered polygons.
 */

EzServerClient.Polygon.include(!EzServerClient.Path.CANVAS ? {} : {
	_containsPoint: function (p) {
		var inside = false,
		    part, p1, p2,
		    i, j, k,
		    len, len2;

		// TODO optimization: check if within bounds first

		if (EzServerClient.Polyline.prototype._containsPoint.call(this, p, true)) {
			// click on polygon border
			return true;
		}

		// ray casting algorithm for detecting if point is in polygon

		for (i = 0, len = this._parts.length; i < len; i++) {
			part = this._parts[i];

			for (j = 0, len2 = part.length, k = len2 - 1; j < len2; k = j++) {
				p1 = part[j];
				p2 = part[k];

				if (((p1.y > p.y) !== (p2.y > p.y)) &&
						(p.x < (p2.x - p1.x) * (p.y - p1.y) / (p2.y - p1.y) + p1.x)) {
					inside = !inside;
				}
			}
		}

		return inside;
	}
});


/*
 * Extends EzServerClient.Circle with Canvas-specific code.
 */

EzServerClient.Circle.include(!EzServerClient.Path.CANVAS ? {} : {
	_drawPath: function () {
		var p = this._point;
		this._ctx.beginPath();
		this._ctx.arc(p.x, p.y, this._radius, 0, Math.PI * 2, false);
	},

	_containsPoint: function (p) {
		var center = this._point,
		    w2 = this.options.stroke ? this.options.weight / 2 : 0;

		return (p.distanceTo(center) <= this._radius + w2);
	}
});


/*
 * Extends EzServerClient.GPS Monitoring with Canvas-specific code.
 */

EzServerClient.GpsMonitoring.include(!EzServerClient.Path.CANVAS ? {} : {
	_drawPath: function () {
		var p = this._point;
		this._ctx.beginPath();
		this._ctx.arc(p.x, p.y, this._radius, 0, Math.PI * 2, false);
	},

	_containsPoint: function (p) {
		var center = this._point,
		    w2 = this.options.stroke ? this.options.weight / 2 : 0;

		return (p.distanceTo(center) <= this._radius + w2);
	}
});

/*
 * CircleMarker canvas specific drawing parts.
 */

EzServerClient.CircleMarker.include(!EzServerClient.Path.CANVAS ? {} : {
	_updateStyle: function () {
		EzServerClient.Path.prototype._updateStyle.call(this);
	}
});


/*
 * EzServerClient.GeoJSON turns any GeoJSON data into a Leaflet layer.
 */

EzServerClient.GeoJSON = EzServerClient.FeatureGroup.extend({

	initialize: function (geojson, options) {
		EzServerClient.setOptions(this, options);

		this._layers = {};

		if (geojson) {
			this.addData(geojson);
		}
	},

	addData: function (geojson) {
		var features = EzServerClient.Util.isArray(geojson) ? geojson : geojson.features,
		    i, len, feature;

		if (features) {
			for (i = 0, len = features.length; i < len; i++) {
				// Only add this if geometry or geometries are set and not null
				feature = features[i];
				if (feature.geometries || feature.geometry || feature.features || feature.coordinates) {
					this.addData(features[i]);
				}
			}
			return this;
		}

		var options = this.options;

		if (options.filter && !options.filter(geojson)) { return; }

		var layer = EzServerClient.GeoJSON.geometryToLayer(geojson, options.pointToLayer, options.coordsToLatLng, options);
		layer.feature = EzServerClient.GeoJSON.asFeature(geojson);

		layer.defaultOptions = layer.options;
		this.resetStyle(layer);

		if (options.onEachFeature) {
			options.onEachFeature(geojson, layer);
		}

		return this.addLayer(layer);
	},

	resetStyle: function (layer) {
		var style = this.options.style;
		if (style) {
			// reset any custom styles
			EzServerClient.Util.extend(layer.options, layer.defaultOptions);

			this._setLayerStyle(layer, style);
		}
	},

	setStyle: function (style) {
		this.eachLayer(function (layer) {
			this._setLayerStyle(layer, style);
		}, this);
	},

	_setLayerStyle: function (layer, style) {
		if (typeof style === 'function') {
			style = style(layer.feature);
		}
		if (layer.setStyle) {
			layer.setStyle(style);
		}
	}
});

EzServerClient.extend(EzServerClient.GeoJSON, {
	geometryToLayer: function (geojson, pointToLayer, coordsToLatLng, vectorOptions) {
		var geometry = geojson.type === 'Feature' ? geojson.geometry : geojson,
		    coords = geometry.coordinates,
		    layers = [],
		    latlng, latlngs, i, len;

		coordsToLatLng = coordsToLatLng || this.coordsToLatLng;

		switch (geometry.type) {
		case 'Point':
			latlng = coordsToLatLng(coords);
			return pointToLayer ? pointToLayer(geojson, latlng) : new EzServerClient.Marker(latlng);

		case 'MultiPoint':
			for (i = 0, len = coords.length; i < len; i++) {
				latlng = coordsToLatLng(coords[i]);
				layers.push(pointToLayer ? pointToLayer(geojson, latlng) : new EzServerClient.Marker(latlng));
			}
			return new EzServerClient.FeatureGroup(layers);

		case 'LineString':
			latlngs = this.coordsToLatLngs(coords, 0, coordsToLatLng);
			return new EzServerClient.Polyline(latlngs, vectorOptions);

		case 'Polygon':
			if (coords.length === 2 && !coords[1].length) {
				throw new Error('Invalid GeoJSON object.');
			}
			latlngs = this.coordsToLatLngs(coords, 1, coordsToLatLng);
			return new EzServerClient.Polygon(latlngs, vectorOptions);

		case 'MultiLineString':
			latlngs = this.coordsToLatLngs(coords, 1, coordsToLatLng);
			return new EzServerClient.MultiPolyline(latlngs, vectorOptions);

		case 'MultiPolygon':
			latlngs = this.coordsToLatLngs(coords, 2, coordsToLatLng);
			return new EzServerClient.MultiPolygon(latlngs, vectorOptions);

		case 'GeometryCollection':
			for (i = 0, len = geometry.geometries.length; i < len; i++) {

				layers.push(this.geometryToLayer({
					geometry: geometry.geometries[i],
					type: 'Feature',
					properties: geojson.properties
				}, pointToLayer, coordsToLatLng, vectorOptions));
			}
			return new EzServerClient.FeatureGroup(layers);

		default:
			throw new Error('Invalid GeoJSON object.');
		}
	},

	coordsToLatLng: function (coords) { // (Array[, Boolean]) -> LatLng
		return new EzServerClient.LatLng(coords[1], coords[0], coords[2]);
	},

	coordsToLatLngs: function (coords, levelsDeep, coordsToLatLng) { // (Array[, Number, Function]) -> Array
		var latlng, i, len,
		    latlngs = [];

		for (i = 0, len = coords.length; i < len; i++) {
			latlng = levelsDeep ?
			        this.coordsToLatLngs(coords[i], levelsDeep - 1, coordsToLatLng) :
			        (coordsToLatLng || this.coordsToLatLng)(coords[i]);

			latlngs.push(latlng);
		}

		return latlngs;
	},

	latLngToCoords: function (latlng) {
		var coords = [latlng.lng, latlng.lat];

		if (latlng.alt !== undefined) {
			coords.push(latlng.alt);
		}
		return coords;
	},

	latLngsToCoords: function (latLngs) {
		var coords = [];

		for (var i = 0, len = latLngs.length; i < len; i++) {
			coords.push(EzServerClient.GeoJSON.latLngToCoords(latLngs[i]));
		}

		return coords;
	},

	getFeature: function (layer, newGeometry) {
		return layer.feature ? EzServerClient.extend({}, layer.feature, {geometry: newGeometry}) : EzServerClient.GeoJSON.asFeature(newGeometry);
	},

	asFeature: function (geoJSON) {
		if (geoJSON.type === 'Feature') {
			return geoJSON;
		}

		return {
			type: 'Feature',
			properties: {},
			geometry: geoJSON
		};
	}
});

var PointToGeoJSON = {
	toGeoJSON: function () {
		return EzServerClient.GeoJSON.getFeature(this, {
			type: 'Point',
			coordinates: EzServerClient.GeoJSON.latLngToCoords(this.getLatLng())
		});
	}
};

EzServerClient.Marker.include(PointToGeoJSON);
EzServerClient.Circle.include(PointToGeoJSON);
EzServerClient.CircleMarker.include(PointToGeoJSON);

EzServerClient.Polyline.include({
	toGeoJSON: function () {
		return EzServerClient.GeoJSON.getFeature(this, {
			type: 'LineString',
			coordinates: EzServerClient.GeoJSON.latLngsToCoords(this.getLatLngs())
		});
	}
});

EzServerClient.Polygon.include({
	toGeoJSON: function () {
		var coords = [EzServerClient.GeoJSON.latLngsToCoords(this.getLatLngs())],
		    i, len, hole;

		coords[0].push(coords[0][0]);

		if (this._holes) {
			for (i = 0, len = this._holes.length; i < len; i++) {
				hole = EzServerClient.GeoJSON.latLngsToCoords(this._holes[i]);
				hole.push(hole[0]);
				coords.push(hole);
			}
		}

		return EzServerClient.GeoJSON.getFeature(this, {
			type: 'Polygon',
			coordinates: coords
		});
	}
});

(function () {
	function multiToGeoJSON(type) {
		return function () {
			var coords = [];

			this.eachLayer(function (layer) {
				coords.push(layer.toGeoJSON().geometry.coordinates);
			});

			return EzServerClient.GeoJSON.getFeature(this, {
				type: type,
				coordinates: coords
			});
		};
	}

	EzServerClient.MultiPolyline.include({toGeoJSON: multiToGeoJSON('MultiLineString')});
	EzServerClient.MultiPolygon.include({toGeoJSON: multiToGeoJSON('MultiPolygon')});

	EzServerClient.LayerGroup.include({
		toGeoJSON: function () {

			var geometry = this.feature && this.feature.geometry,
				jsons = [],
				json;

			if (geometry && geometry.type === 'MultiPoint') {
				return multiToGeoJSON('MultiPoint').call(this);
			}

			var isGeometryCollection = geometry && geometry.type === 'GeometryCollection';

			this.eachLayer(function (layer) {
				if (layer.toGeoJSON) {
					json = layer.toGeoJSON();
					jsons.push(isGeometryCollection ? json.geometry : EzServerClient.GeoJSON.asFeature(json));
				}
			});

			if (isGeometryCollection) {
				return EzServerClient.GeoJSON.getFeature(this, {
					geometries: jsons,
					type: 'GeometryCollection'
				});
			}

			return {
				type: 'FeatureCollection',
				features: jsons
			};
		}
	});
}());

EzServerClient.geoJson = function (geojson, options) {
	return new EzServerClient.GeoJSON(geojson, options);
};


/*
 * EzServerClient.DomEvent contains functions for working with DOM events.
 */

EzServerClient.DomEvent = {
	/* inspired by John Resig, Dean Edwards and YUI addEvent implementations */
	addListener: function (obj, type, fn, context) { // (HTMLElement, String, Function[, Object])

		var id = EzServerClient.stamp(fn),
		    key = '_leaflet_' + type + id,
		    handler, originalHandler, newType;

		if (obj[key]) { return this; }

		handler = function (e) {
			return fn.call(context || obj, e || EzServerClient.DomEvent._getEvent());
		};

		if (EzServerClient.Browser.pointer && type.indexOf('touch') === 0) {
			return this.addPointerListener(obj, type, handler, id);
		}
		if (EzServerClient.Browser.touch && (type === 'dblclick') && this.addDoubleTapListener) {
			this.addDoubleTapListener(obj, handler, id);
		}

		if ('addEventListener' in obj) {

			if (type === 'mousewheel') {
				obj.addEventListener('DOMMouseScroll', handler, false);
				obj.addEventListener(type, handler, false);

			} else if ((type === 'mouseenter') || (type === 'mouseleave')) {

				originalHandler = handler;
				newType = (type === 'mouseenter' ? 'mouseover' : 'mouseout');

				handler = function (e) {
					if (!EzServerClient.DomEvent._checkMouse(obj, e)) { return; }
					return originalHandler(e);
				};

				obj.addEventListener(newType, handler, false);

			} else if (type === 'click' && EzServerClient.Browser.android) {
				originalHandler = handler;
				handler = function (e) {
					return EzServerClient.DomEvent._filterClick(e, originalHandler);
				};

				obj.addEventListener(type, handler, false);
			} else {
				obj.addEventListener(type, handler, false);
			}

		} else if ('attachEvent' in obj) {
			obj.attachEvent('on' + type, handler);
		}

		obj[key] = handler;

		return this;
	},

	removeListener: function (obj, type, fn) {  // (HTMLElement, String, Function)

		var id = EzServerClient.stamp(fn),
		    key = '_leaflet_' + type + id,
		    handler = obj[key];

		if (!handler) { return this; }

		if (EzServerClient.Browser.pointer && type.indexOf('touch') === 0) {
			this.removePointerListener(obj, type, id);
		} else if (EzServerClient.Browser.touch && (type === 'dblclick') && this.removeDoubleTapListener) {
			this.removeDoubleTapListener(obj, id);

		} else if ('removeEventListener' in obj) {

			if (type === 'mousewheel') {
				obj.removeEventListener('DOMMouseScroll', handler, false);
				obj.removeEventListener(type, handler, false);

			} else if ((type === 'mouseenter') || (type === 'mouseleave')) {
				obj.removeEventListener((type === 'mouseenter' ? 'mouseover' : 'mouseout'), handler, false);
			} else {
				obj.removeEventListener(type, handler, false);
			}
		} else if ('detachEvent' in obj) {
			obj.detachEvent('on' + type, handler);
		}

		obj[key] = null;

		return this;
	},

	stopPropagation: function (e) {

		if (e.stopPropagation) {
			e.stopPropagation();
		} else {
			e.cancelBubble = true;
		}
		EzServerClient.DomEvent._skipped(e);

		return this;
	},

	disableScrollPropagation: function (el) {
		var stop = EzServerClient.DomEvent.stopPropagation;

		return EzServerClient.DomEvent
			.on(el, 'mousewheel', stop)
			.on(el, 'MozMousePixelScroll', stop);
	},

	disableClickPropagation: function (el) {
		var stop = EzServerClient.DomEvent.stopPropagation;

		for (var i = EzServerClient.Draggable.START.length - 1; i >= 0; i--) {
			EzServerClient.DomEvent.on(el, EzServerClient.Draggable.START[i], stop);
		}

		return EzServerClient.DomEvent
			.on(el, 'click', EzServerClient.DomEvent._fakeStop)
			.on(el, 'dblclick', stop);
	},

	preventDefault: function (e) {

		if (e.preventDefault) {
			e.preventDefault();
		} else {
			e.returnValue = false;
		}
		return this;
	},

	stop: function (e) {
		return EzServerClient.DomEvent
			.preventDefault(e)
			.stopPropagation(e);
	},

	getMousePosition: function (e, container) {
		if (!container) {
			return new EzServerClient.Point(e.clientX, e.clientY);
		}

		var rect = container.getBoundingClientRect();

		return new EzServerClient.Point(
			e.clientX - rect.left - container.clientLeft,
			e.clientY - rect.top - container.clientTop);
	},

	getWheelDelta: function (e) {

		var delta = 0;

		if (e.wheelDelta) {
			delta = e.wheelDelta / 120;
		}
		if (e.detail) {
			delta = -e.detail / 3;
		}
		return delta;
	},

	_skipEvents: {},

	_fakeStop: function (e) {
		// fakes stopPropagation by setting a special event flag, checked/reset with EzServerClient.DomEvent._skipped(e)
		EzServerClient.DomEvent._skipEvents[e.type] = true;
	},

	_skipped: function (e) {
		var skipped = this._skipEvents[e.type];
		// reset when checking, as it's only used in map container and propagates outside of the map
		this._skipEvents[e.type] = false;
		return skipped;
	},

	// check if element really left/entered the event target (for mouseenter/mouseleave)
	_checkMouse: function (el, e) {

		var related = e.relatedTarget;

		if (!related) { return true; }

		try {
			while (related && (related !== el)) {
				related = related.parentNode;
			}
		} catch (err) {
			return false;
		}
		return (related !== el);
	},

	_getEvent: function () { // evil magic for IE
		/*jshint noarg:false */
		var e = window.event;
		if (!e) {
			var caller = arguments.callee.caller;
			while (caller) {
				e = caller['arguments'][0];
				if (e && window.Event === e.constructor) {
					break;
				}
				caller = caller.caller;
			}
		}
		return e;
	},

	// this is a horrible workaround for a bug in Android where a single touch triggers two click events
	_filterClick: function (e, handler) {
		var timeStamp = (e.timeStamp || e.originalEvent.timeStamp),
			elapsed = EzServerClient.DomEvent._lastClick && (timeStamp - EzServerClient.DomEvent._lastClick);

		// are they closer together than 500ms yet more than 100ms?
		// Android typically triggers them ~300ms apart while multiple listeners
		// on the same event should be triggered far faster;
		// or check if click is simulated on the element, and if it is, reject any non-simulated events

		if ((elapsed && elapsed > 100 && elapsed < 500) || (e.target._simulatedClick && !e._simulated)) {
			EzServerClient.DomEvent.stop(e);
			return;
		}
		EzServerClient.DomEvent._lastClick = timeStamp;

		return handler(e);
	}
};

EzServerClient.DomEvent.on = EzServerClient.DomEvent.addListener;
EzServerClient.DomEvent.off = EzServerClient.DomEvent.removeListener;


/*
 * EzServerClient.Draggable allows you to add dragging capabilities to any element. Supports mobile devices too.
 */

EzServerClient.Draggable = EzServerClient.Class.extend({
	includes: EzServerClient.Mixin.Events,

	statics: {
		START: EzServerClient.Browser.touch ? ['touchstart', 'mousedown'] : ['mousedown'],
		END: {
			mousedown: 'mouseup',
			touchstart: 'touchend',
			pointerdown: 'touchend',
			MSPointerDown: 'touchend'
		},
		MOVE: {
			mousedown: 'mousemove',
			touchstart: 'touchmove',
			pointerdown: 'touchmove',
			MSPointerDown: 'touchmove'
		}
	},

	initialize: function (element, dragStartTarget) {
		this._element = element;
		this._dragStartTarget = dragStartTarget || element;
	},

	enable: function () {
		if (this._enabled) { return; }

		for (var i = EzServerClient.Draggable.START.length - 1; i >= 0; i--) {
			EzServerClient.DomEvent.on(this._dragStartTarget, EzServerClient.Draggable.START[i], this._onDown, this);
		}

		this._enabled = true;
	},

	disable: function () {
		if (!this._enabled) { return; }

		for (var i = EzServerClient.Draggable.START.length - 1; i >= 0; i--) {
			EzServerClient.DomEvent.off(this._dragStartTarget, EzServerClient.Draggable.START[i], this._onDown, this);
		}

		this._enabled = false;
		this._moved = false;
	},

	_onDown: function (e) {
		this._moved = false;

		if (e.shiftKey || ((e.which !== 1) && (e.button !== 1) && !e.touches)) { return; }

		EzServerClient.DomEvent.stopPropagation(e);

		if (EzServerClient.Draggable._disabled) { return; }

		EzServerClient.DomUtil.disableImageDrag();
		EzServerClient.DomUtil.disableTextSelection();

		if (this._moving) { return; }

		var first = e.touches ? e.touches[0] : e;

		this._startPoint = new EzServerClient.Point(first.clientX, first.clientY);
		this._startPos = this._newPos = EzServerClient.DomUtil.getPosition(this._element);

		EzServerClient.DomEvent
		    .on(document, EzServerClient.Draggable.MOVE[e.type], this._onMove, this)
		    .on(document, EzServerClient.Draggable.END[e.type], this._onUp, this);
	},

	_onMove: function (e) {
		if (e.touches && e.touches.length > 1) {
			this._moved = true;
			return;
		}

		var first = (e.touches && e.touches.length === 1 ? e.touches[0] : e),
		    newPoint = new EzServerClient.Point(first.clientX, first.clientY),
		    offset = newPoint.subtract(this._startPoint);

		if (!offset.x && !offset.y) { return; }
		if (EzServerClient.Browser.touch && Math.abs(offset.x) + Math.abs(offset.y) < 3) { return; }

		EzServerClient.DomEvent.preventDefault(e);

		if (!this._moved) {
			this.fire('dragstart');

			this._moved = true;
			this._startPos = EzServerClient.DomUtil.getPosition(this._element).subtract(offset);

			EzServerClient.DomUtil.addClass(document.body, 'leaflet-dragging');
			this._lastTarget = e.target || e.srcElement;
			EzServerClient.DomUtil.addClass(this._lastTarget, 'leaflet-drag-target');
		}

		this._newPos = this._startPos.add(offset);
		this._moving = true;

		EzServerClient.Util.cancelAnimFrame(this._animRequest);
		this._animRequest = EzServerClient.Util.requestAnimFrame(this._updatePosition, this, true, this._dragStartTarget);
	},

	_updatePosition: function () {
		this.fire('predrag');
		EzServerClient.DomUtil.setPosition(this._element, this._newPos);
		this.fire('drag');
	},

	_onUp: function () {
		EzServerClient.DomUtil.removeClass(document.body, 'leaflet-dragging');

		if (this._lastTarget) {
			EzServerClient.DomUtil.removeClass(this._lastTarget, 'leaflet-drag-target');
			this._lastTarget = null;
		}

		for (var i in EzServerClient.Draggable.MOVE) {
			EzServerClient.DomEvent
			    .off(document, EzServerClient.Draggable.MOVE[i], this._onMove)
			    .off(document, EzServerClient.Draggable.END[i], this._onUp);
		}

		EzServerClient.DomUtil.enableImageDrag();
		EzServerClient.DomUtil.enableTextSelection();

		if (this._moved && this._moving) {
			// ensure drag is not fired after dragend
			EzServerClient.Util.cancelAnimFrame(this._animRequest);

			this.fire('dragend', {
				distance: this._newPos.distanceTo(this._startPos)
			});
		}

		this._moving = false;
	}
});


/*
	EzServerClient.Handler is a base class for handler classes that are used internally to inject
	interaction features like dragging to classes like Map and Marker.
*/

EzServerClient.Handler = EzServerClient.Class.extend({
	initialize: function (map) {
		this._map = map;
	},

	enable: function () {
		if (this._enabled) { return; }

		this._enabled = true;
		this.addHooks();
	},

	disable: function () {
		if (!this._enabled) { return; }

		this._enabled = false;
		this.removeHooks();
	},

	enabled: function () {
		return !!this._enabled;
	}
});


/*
 * EzServerClient.Handler.MapDrag is used to make the map draggable (with panning inertia), enabled by default.
 */

EzServerClient.Map.mergeOptions({
	dragging: true,

	inertia: !EzServerClient.Browser.android23,
	inertiaDeceleration: 3400, // px/s^2
	inertiaMaxSpeed: Infinity, // px/s
	inertiaThreshold: EzServerClient.Browser.touch ? 32 : 18, // ms
	easeLinearity: 0.25,

	// TODO refactor, move to CRS
	worldCopyJump: false
});

EzServerClient.Map.Drag = EzServerClient.Handler.extend({
	addHooks: function () {
		if (!this._draggable) {
			var map = this._map;

			this._draggable = new EzServerClient.Draggable(map._mapPane, map._container);

			this._draggable.on({
				'dragstart': this._onDragStart,
				'drag': this._onDrag,
				'dragend': this._onDragEnd
			}, this);

			if (map.options.worldCopyJump) {
				this._draggable.on('predrag', this._onPreDrag, this);
				map.on('viewreset', this._onViewReset, this);

				map.whenReady(this._onViewReset, this);
			}
		}
		this._draggable.enable();
	},

	removeHooks: function () {
		this._draggable.disable();
	},

	moved: function () {
		return this._draggable && this._draggable._moved;
	},

	_onDragStart: function () {
		var map = this._map;

		if (map._panAnim) {
			map._panAnim.stop();
		}

		map
		    .fire('movestart')
		    .fire('dragstart');

		if (map.options.inertia) {
			this._positions = [];
			this._times = [];
		}
	},

	_onDrag: function () {
		if (this._map.options.inertia) {
			var time = this._lastTime = +new Date(),
			    pos = this._lastPos = this._draggable._newPos;

			this._positions.push(pos);
			this._times.push(time);

			if (time - this._times[0] > 200) {
				this._positions.shift();
				this._times.shift();
			}
		}

		this._map
		    .fire('move')
		    .fire('drag');
	},

	_onViewReset: function () {
		// TODO fix hardcoded Earth values
		var pxCenter = this._map.getSize()._divideBy(2),
		    pxWorldCenter = this._map.latLngToLayerPoint([0, 0]);

		this._initialWorldOffset = pxWorldCenter.subtract(pxCenter).x;
		this._worldWidth = this._map.project([0, 180]).x;
	},

	_onPreDrag: function () {
		// TODO refactor to be able to adjust map pane position after zoom
		var worldWidth = this._worldWidth,
		    halfWidth = Math.round(worldWidth / 2),
		    dx = this._initialWorldOffset,
		    x = this._draggable._newPos.x,
		    newX1 = (x - halfWidth + dx) % worldWidth + halfWidth - dx,
		    newX2 = (x + halfWidth + dx) % worldWidth - halfWidth - dx,
		    newX = Math.abs(newX1 + dx) < Math.abs(newX2 + dx) ? newX1 : newX2;

		this._draggable._newPos.x = newX;
	},

	_onDragEnd: function (e) {
		var map = this._map,
		    options = map.options,
		    delay = +new Date() - this._lastTime,

		    noInertia = !options.inertia || delay > options.inertiaThreshold || !this._positions[0];

		map.fire('dragend', e);

		if (noInertia) {
			map.fire('moveend');

		} else {

			var direction = this._lastPos.subtract(this._positions[0]),
			    duration = (this._lastTime + delay - this._times[0]) / 1000,
			    ease = options.easeLinearity,

			    speedVector = direction.multiplyBy(ease / duration),
			    speed = speedVector.distanceTo([0, 0]),

			    limitedSpeed = Math.min(options.inertiaMaxSpeed, speed),
			    limitedSpeedVector = speedVector.multiplyBy(limitedSpeed / speed),

			    decelerationDuration = limitedSpeed / (options.inertiaDeceleration * ease),
			    offset = limitedSpeedVector.multiplyBy(-decelerationDuration / 2).round();

			if (!offset.x || !offset.y) {
				map.fire('moveend');

			} else {
				offset = map._limitOffset(offset, map.options.maxBounds);

				EzServerClient.Util.requestAnimFrame(function () {
					map.panBy(offset, {
						duration: decelerationDuration,
						easeLinearity: ease,
						noMoveStart: true
					});
				});
			}
		}
	}
});

EzServerClient.Map.addInitHook('addHandler', 'dragging', EzServerClient.Map.Drag);


/*
 * EzServerClient.Handler.DoubleClickZoom is used to handle double-click zoom on the map, enabled by default.
 */

EzServerClient.Map.mergeOptions({
	doubleClickZoom: true
});

EzServerClient.Map.DoubleClickZoom = EzServerClient.Handler.extend({
	addHooks: function () {
		this._map.on('dblclick', this._onDoubleClick, this);
	},

	removeHooks: function () {
		this._map.off('dblclick', this._onDoubleClick, this);
	},

	_onDoubleClick: function (e) {
		var map = this._map,
		    zoom = map.getZoom() + (e.originalEvent.shiftKey ? -1 : 1);

		if (map.options.doubleClickZoom === 'center') {
			map.setZoom(zoom);
		} else {
			map.setZoomAround(e.containerPoint, zoom);
		}
	}
});

EzServerClient.Map.addInitHook('addHandler', 'doubleClickZoom', EzServerClient.Map.DoubleClickZoom);


/*
 * EzServerClient.Handler.ScrollWheelZoom is used by EzServerClient.Map to enable mouse scroll wheel zoom on the map.
 */

EzServerClient.Map.mergeOptions({
	scrollWheelZoom: true
});

EzServerClient.Map.ScrollWheelZoom = EzServerClient.Handler.extend({
	addHooks: function () {
		EzServerClient.DomEvent.on(this._map._container, 'mousewheel', this._onWheelScroll, this);
		EzServerClient.DomEvent.on(this._map._container, 'MozMousePixelScroll', EzServerClient.DomEvent.preventDefault);
		this._delta = 0;
	},

	removeHooks: function () {
		EzServerClient.DomEvent.off(this._map._container, 'mousewheel', this._onWheelScroll);
		EzServerClient.DomEvent.off(this._map._container, 'MozMousePixelScroll', EzServerClient.DomEvent.preventDefault);
	},

	_onWheelScroll: function (e) {
		var delta = EzServerClient.DomEvent.getWheelDelta(e);

		this._delta += delta;
		this._lastMousePos = this._map.mouseEventToContainerPoint(e);

		if (!this._startTime) {
			this._startTime = +new Date();
		}

		var left = Math.max(40 - (+new Date() - this._startTime), 0);

		clearTimeout(this._timer);
		this._timer = setTimeout(EzServerClient.bind(this._performZoom, this), left);

		EzServerClient.DomEvent.preventDefault(e);
		EzServerClient.DomEvent.stopPropagation(e);
	},

	_performZoom: function () {
		var map = this._map,
		    delta = this._delta,
		    zoom = map.getZoom();

		delta = delta > 0 ? Math.ceil(delta) : Math.floor(delta);
		delta = Math.max(Math.min(delta, 4), -4);
		delta = map._limitZoom(zoom + delta) - zoom;

		this._delta = 0;
		this._startTime = null;

		if (!delta) { return; }

		if (map.options.scrollWheelZoom === 'center') {
			map.setZoom(zoom + delta);
		} else {
			map.setZoomAround(this._lastMousePos, zoom + delta);
		}
	}
});

EzServerClient.Map.addInitHook('addHandler', 'scrollWheelZoom', EzServerClient.Map.ScrollWheelZoom);


/*
 * Extends the event handling code with double tap support for mobile browsers.
 */

EzServerClient.extend(EzServerClient.DomEvent, {

	_touchstart: EzServerClient.Browser.msPointer ? 'MSPointerDown' : EzServerClient.Browser.pointer ? 'pointerdown' : 'touchstart',
	_touchend: EzServerClient.Browser.msPointer ? 'MSPointerUp' : EzServerClient.Browser.pointer ? 'pointerup' : 'touchend',

	// inspired by Zepto touch code by Thomas Fuchs
	addDoubleTapListener: function (obj, handler, id) {
		var last,
		    doubleTap = false,
		    delay = 250,
		    touch,
		    pre = '_leaflet_',
		    touchstart = this._touchstart,
		    touchend = this._touchend,
		    trackedTouches = [];

		function onTouchStart(e) {
			var count;

			if (EzServerClient.Browser.pointer) {
				trackedTouches.push(e.pointerId);
				count = trackedTouches.length;
			} else {
				count = e.touches.length;
			}
			if (count > 1) {
				return;
			}

			var now = Date.now(),
				delta = now - (last || now);

			touch = e.touches ? e.touches[0] : e;
			doubleTap = (delta > 0 && delta <= delay);
			last = now;
		}

		function onTouchEnd(e) {
			if (EzServerClient.Browser.pointer) {
				var idx = trackedTouches.indexOf(e.pointerId);
				if (idx === -1) {
					return;
				}
				trackedTouches.splice(idx, 1);
			}

			if (doubleTap) {
				if (EzServerClient.Browser.pointer) {
					// work around .type being readonly with MSPointer* events
					var newTouch = { },
						prop;

					// jshint forin:false
					for (var i in touch) {
						prop = touch[i];
						if (typeof prop === 'function') {
							newTouch[i] = prop.bind(touch);
						} else {
							newTouch[i] = prop;
						}
					}
					touch = newTouch;
				}
				touch.type = 'dblclick';
				handler(touch);
				last = null;
			}
		}
		obj[pre + touchstart + id] = onTouchStart;
		obj[pre + touchend + id] = onTouchEnd;

		// on pointer we need to listen on the document, otherwise a drag starting on the map and moving off screen
		// will not come through to us, so we will lose track of how many touches are ongoing
		var endElement = EzServerClient.Browser.pointer ? document.documentElement : obj;

		obj.addEventListener(touchstart, onTouchStart, false);
		endElement.addEventListener(touchend, onTouchEnd, false);

		if (EzServerClient.Browser.pointer) {
			endElement.addEventListener(EzServerClient.DomEvent.POINTER_CANCEL, onTouchEnd, false);
		}

		return this;
	},

	removeDoubleTapListener: function (obj, id) {
		var pre = '_leaflet_';

		obj.removeEventListener(this._touchstart, obj[pre + this._touchstart + id], false);
		(EzServerClient.Browser.pointer ? document.documentElement : obj).removeEventListener(
		        this._touchend, obj[pre + this._touchend + id], false);

		if (EzServerClient.Browser.pointer) {
			document.documentElement.removeEventListener(EzServerClient.DomEvent.POINTER_CANCEL, obj[pre + this._touchend + id],
				false);
		}

		return this;
	}
});


/*
 * Extends EzServerClient.DomEvent to provide touch support for Internet Explorer and Windows-based devices.
 */

EzServerClient.extend(EzServerClient.DomEvent, {

	//static
	POINTER_DOWN: EzServerClient.Browser.msPointer ? 'MSPointerDown' : 'pointerdown',
	POINTER_MOVE: EzServerClient.Browser.msPointer ? 'MSPointerMove' : 'pointermove',
	POINTER_UP: EzServerClient.Browser.msPointer ? 'MSPointerUp' : 'pointerup',
	POINTER_CANCEL: EzServerClient.Browser.msPointer ? 'MSPointerCancel' : 'pointercancel',

	_pointers: [],
	_pointerDocumentListener: false,

	// Provides a touch events wrapper for (ms)pointer events.
	// Based on changes by veproza https://github.com/CloudMade/Leaflet/pull/1019
	//ref http://www.w3.org/TR/pointerevents/ https://www.w3.org/Bugs/Public/show_bug.cgi?id=22890

	addPointerListener: function (obj, type, handler, id) {

		switch (type) {
		case 'touchstart':
			return this.addPointerListenerStart(obj, type, handler, id);
		case 'touchend':
			return this.addPointerListenerEnd(obj, type, handler, id);
		case 'touchmove':
			return this.addPointerListenerMove(obj, type, handler, id);
		default:
			throw 'Unknown touch event type';
		}
	},

	addPointerListenerStart: function (obj, type, handler, id) {
		var pre = '_leaflet_',
		    pointers = this._pointers;

		var cb = function (e) {

			EzServerClient.DomEvent.preventDefault(e);

			var alreadyInArray = false;
			for (var i = 0; i < pointers.length; i++) {
				if (pointers[i].pointerId === e.pointerId) {
					alreadyInArray = true;
					break;
				}
			}
			if (!alreadyInArray) {
				pointers.push(e);
			}

			e.touches = pointers.slice();
			e.changedTouches = [e];

			handler(e);
		};

		obj[pre + 'touchstart' + id] = cb;
		obj.addEventListener(this.POINTER_DOWN, cb, false);

		// need to also listen for end events to keep the _pointers list accurate
		// this needs to be on the body and never go away
		if (!this._pointerDocumentListener) {
			var internalCb = function (e) {
				for (var i = 0; i < pointers.length; i++) {
					if (pointers[i].pointerId === e.pointerId) {
						pointers.splice(i, 1);
						break;
					}
				}
			};
			//We listen on the documentElement as any drags that end by moving the touch off the screen get fired there
			document.documentElement.addEventListener(this.POINTER_UP, internalCb, false);
			document.documentElement.addEventListener(this.POINTER_CANCEL, internalCb, false);

			this._pointerDocumentListener = true;
		}

		return this;
	},

	addPointerListenerMove: function (obj, type, handler, id) {
		var pre = '_leaflet_',
		    touches = this._pointers;

		function cb(e) {

			// don't fire touch moves when mouse isn't down
			if ((e.pointerType === e.MSPOINTER_TYPE_MOUSE || e.pointerType === 'mouse') && e.buttons === 0) { return; }

			for (var i = 0; i < touches.length; i++) {
				if (touches[i].pointerId === e.pointerId) {
					touches[i] = e;
					break;
				}
			}

			e.touches = touches.slice();
			e.changedTouches = [e];

			handler(e);
		}

		obj[pre + 'touchmove' + id] = cb;
		obj.addEventListener(this.POINTER_MOVE, cb, false);

		return this;
	},

	addPointerListenerEnd: function (obj, type, handler, id) {
		var pre = '_leaflet_',
		    touches = this._pointers;

		var cb = function (e) {
			for (var i = 0; i < touches.length; i++) {
				if (touches[i].pointerId === e.pointerId) {
					touches.splice(i, 1);
					break;
				}
			}

			e.touches = touches.slice();
			e.changedTouches = [e];

			handler(e);
		};

		obj[pre + 'touchend' + id] = cb;
		obj.addEventListener(this.POINTER_UP, cb, false);
		obj.addEventListener(this.POINTER_CANCEL, cb, false);

		return this;
	},

	removePointerListener: function (obj, type, id) {
		var pre = '_leaflet_',
		    cb = obj[pre + type + id];

		switch (type) {
		case 'touchstart':
			obj.removeEventListener(this.POINTER_DOWN, cb, false);
			break;
		case 'touchmove':
			obj.removeEventListener(this.POINTER_MOVE, cb, false);
			break;
		case 'touchend':
			obj.removeEventListener(this.POINTER_UP, cb, false);
			obj.removeEventListener(this.POINTER_CANCEL, cb, false);
			break;
		}

		return this;
	}
});


/*
 * EzServerClient.Handler.TouchZoom is used by EzServerClient.Map to add pinch zoom on supported mobile browsers.
 */

EzServerClient.Map.mergeOptions({
	touchZoom: EzServerClient.Browser.touch && !EzServerClient.Browser.android23,
	bounceAtZoomLimits: true
});

EzServerClient.Map.TouchZoom = EzServerClient.Handler.extend({
	addHooks: function () {
		EzServerClient.DomEvent.on(this._map._container, 'touchstart', this._onTouchStart, this);
	},

	removeHooks: function () {
		EzServerClient.DomEvent.off(this._map._container, 'touchstart', this._onTouchStart, this);
	},

	_onTouchStart: function (e) {
		var map = this._map;

		if (!e.touches || e.touches.length !== 2 || map._animatingZoom || this._zooming) { return; }

		var p1 = map.mouseEventToLayerPoint(e.touches[0]),
		    p2 = map.mouseEventToLayerPoint(e.touches[1]),
		    viewCenter = map._getCenterLayerPoint();

		this._startCenter = p1.add(p2)._divideBy(2);
		this._startDist = p1.distanceTo(p2);

		this._moved = false;
		this._zooming = true;

		this._centerOffset = viewCenter.subtract(this._startCenter);

		if (map._panAnim) {
			map._panAnim.stop();
		}

		EzServerClient.DomEvent
		    .on(document, 'touchmove', this._onTouchMove, this)
		    .on(document, 'touchend', this._onTouchEnd, this);

		EzServerClient.DomEvent.preventDefault(e);
	},

	_onTouchMove: function (e) {
		var map = this._map;

		if (!e.touches || e.touches.length !== 2 || !this._zooming) { return; }

		var p1 = map.mouseEventToLayerPoint(e.touches[0]),
		    p2 = map.mouseEventToLayerPoint(e.touches[1]);

		this._scale = p1.distanceTo(p2) / this._startDist;
		this._delta = p1._add(p2)._divideBy(2)._subtract(this._startCenter);

		if (this._scale === 1) { return; }

		if (!map.options.bounceAtZoomLimits) {
			if ((map.getZoom() === map.getMinZoom() && this._scale < 1) ||
			    (map.getZoom() === map.getMaxZoom() && this._scale > 1)) { return; }
		}

		if (!this._moved) {
			EzServerClient.DomUtil.addClass(map._mapPane, 'leaflet-touching');

			map
			    .fire('movestart')
			    .fire('zoomstart');

			this._moved = true;
		}

		EzServerClient.Util.cancelAnimFrame(this._animRequest);
		this._animRequest = EzServerClient.Util.requestAnimFrame(
		        this._updateOnMove, this, true, this._map._container);

		EzServerClient.DomEvent.preventDefault(e);
	},

	_updateOnMove: function () {
		var map = this._map,
		    origin = this._getScaleOrigin(),
		    center = map.layerPointToLatLng(origin),
		    zoom = map.getScaleZoom(this._scale);

		map._animateZoom(center, zoom, this._startCenter, this._scale, this._delta, false, true);
	},

	_onTouchEnd: function () {
		if (!this._moved || !this._zooming) {
			this._zooming = false;
			return;
		}

		var map = this._map;

		this._zooming = false;
		EzServerClient.DomUtil.removeClass(map._mapPane, 'leaflet-touching');
		EzServerClient.Util.cancelAnimFrame(this._animRequest);

		EzServerClient.DomEvent
		    .off(document, 'touchmove', this._onTouchMove)
		    .off(document, 'touchend', this._onTouchEnd);

		var origin = this._getScaleOrigin(),
		    center = map.layerPointToLatLng(origin),

		    oldZoom = map.getZoom(),
		    floatZoomDelta = map.getScaleZoom(this._scale) - oldZoom,
		    roundZoomDelta = (floatZoomDelta > 0 ?
		            Math.ceil(floatZoomDelta) : Math.floor(floatZoomDelta)),

		    zoom = map._limitZoom(oldZoom + roundZoomDelta),
		    scale = map.getZoomScale(zoom) / this._scale;

		map._animateZoom(center, zoom, origin, scale);
	},

	_getScaleOrigin: function () {
		var centerOffset = this._centerOffset.subtract(this._delta).divideBy(this._scale);
		return this._startCenter.add(centerOffset);
	}
});

EzServerClient.Map.addInitHook('addHandler', 'touchZoom', EzServerClient.Map.TouchZoom);


/*
 * EzServerClient.Map.Tap is used to enable mobile hacks like quick taps and long hold.
 */

EzServerClient.Map.mergeOptions({
	tap: true,
	tapTolerance: 15
});

EzServerClient.Map.Tap = EzServerClient.Handler.extend({
	addHooks: function () {
		EzServerClient.DomEvent.on(this._map._container, 'touchstart', this._onDown, this);
	},

	removeHooks: function () {
		EzServerClient.DomEvent.off(this._map._container, 'touchstart', this._onDown, this);
	},

	_onDown: function (e) {
		if (!e.touches) { return; }

		EzServerClient.DomEvent.preventDefault(e);

		this._fireClick = true;

		// don't simulate click or track longpress if more than 1 touch
		if (e.touches.length > 1) {
			this._fireClick = false;
			clearTimeout(this._holdTimeout);
			return;
		}

		var first = e.touches[0],
		    el = first.target;

		this._startPos = this._newPos = new EzServerClient.Point(first.clientX, first.clientY);

		// if touching a link, highlight it
		if (el.tagName && el.tagName.toLowerCase() === 'a') {
			EzServerClient.DomUtil.addClass(el, 'leaflet-active');
		}

		// simulate long hold but setting a timeout
		this._holdTimeout = setTimeout(EzServerClient.bind(function () {
			if (this._isTapValid()) {
				this._fireClick = false;
				this._onUp();
				this._simulateEvent('contextmenu', first);
			}
		}, this), 1000);

		EzServerClient.DomEvent
			.on(document, 'touchmove', this._onMove, this)
			.on(document, 'touchend', this._onUp, this);
	},

	_onUp: function (e) {
		clearTimeout(this._holdTimeout);

		EzServerClient.DomEvent
			.off(document, 'touchmove', this._onMove, this)
			.off(document, 'touchend', this._onUp, this);

		if (this._fireClick && e && e.changedTouches) {

			var first = e.changedTouches[0],
			    el = first.target;

			if (el && el.tagName && el.tagName.toLowerCase() === 'a') {
				EzServerClient.DomUtil.removeClass(el, 'leaflet-active');
			}

			// simulate click if the touch didn't move too much
			if (this._isTapValid()) {
				this._simulateEvent('click', first);
			}
		}
	},

	_isTapValid: function () {
		return this._newPos.distanceTo(this._startPos) <= this._map.options.tapTolerance;
	},

	_onMove: function (e) {
		var first = e.touches[0];
		this._newPos = new EzServerClient.Point(first.clientX, first.clientY);
	},

	_simulateEvent: function (type, e) {
		var simulatedEvent = document.createEvent('MouseEvents');

		simulatedEvent._simulated = true;
		e.target._simulatedClick = true;

		simulatedEvent.initMouseEvent(
		        type, true, true, window, 1,
		        e.screenX, e.screenY,
		        e.clientX, e.clientY,
		        false, false, false, false, 0, null);

		e.target.dispatchEvent(simulatedEvent);
	}
});

if (EzServerClient.Browser.touch && !EzServerClient.Browser.pointer) {
	EzServerClient.Map.addInitHook('addHandler', 'tap', EzServerClient.Map.Tap);
}


/*
 * EzServerClient.Handler.ShiftDragZoom is used to add shift-drag zoom interaction to the map
  * (zoom to a selected bounding box), enabled by default.
 */

EzServerClient.Map.mergeOptions({
	boxZoom: true
});

EzServerClient.Map.BoxZoom = EzServerClient.Handler.extend({
	initialize: function (map) {
		this._map = map;
		this._container = map._container;
		this._pane = map._panes.overlayPane;
		this._moved = false;
	},

	addHooks: function () {
		EzServerClient.DomEvent.on(this._container, 'mousedown', this._onMouseDown, this);
	},

	removeHooks: function () {
		EzServerClient.DomEvent.off(this._container, 'mousedown', this._onMouseDown);
		this._moved = false;
	},

	moved: function () {
		return this._moved;
	},

	_onMouseDown: function (e) {
		this._moved = false;

		if (!e.shiftKey || ((e.which !== 1) && (e.button !== 1))) { return false; }

		EzServerClient.DomUtil.disableTextSelection();
		EzServerClient.DomUtil.disableImageDrag();

		this._startLayerPoint = this._map.mouseEventToLayerPoint(e);

		EzServerClient.DomEvent
		    .on(document, 'mousemove', this._onMouseMove, this)
		    .on(document, 'mouseup', this._onMouseUp, this)
		    .on(document, 'keydown', this._onKeyDown, this);
	},

	_onMouseMove: function (e) {
		if (!this._moved) {
			this._box = EzServerClient.DomUtil.create('div', 'leaflet-zoom-box', this._pane);
			EzServerClient.DomUtil.setPosition(this._box, this._startLayerPoint);

			//TODO refactor: move cursor to styles
			this._container.style.cursor = 'crosshair';
			this._map.fire('boxzoomstart');
		}

		var startPoint = this._startLayerPoint,
		    box = this._box,

		    layerPoint = this._map.mouseEventToLayerPoint(e),
		    offset = layerPoint.subtract(startPoint),

		    newPos = new EzServerClient.Point(
		        Math.min(layerPoint.x, startPoint.x),
		        Math.min(layerPoint.y, startPoint.y));

		EzServerClient.DomUtil.setPosition(box, newPos);

		this._moved = true;

		// TODO refactor: remove hardcoded 4 pixels
		box.style.width  = (Math.max(0, Math.abs(offset.x) - 4)) + 'px';
		box.style.height = (Math.max(0, Math.abs(offset.y) - 4)) + 'px';
	},

	_finish: function () {
		if (this._moved) {
			this._pane.removeChild(this._box);
			this._container.style.cursor = '';
		}

		EzServerClient.DomUtil.enableTextSelection();
		EzServerClient.DomUtil.enableImageDrag();

		EzServerClient.DomEvent
		    .off(document, 'mousemove', this._onMouseMove)
		    .off(document, 'mouseup', this._onMouseUp)
		    .off(document, 'keydown', this._onKeyDown);
	},

	_onMouseUp: function (e) {

		this._finish();

		var map = this._map,
		    layerPoint = map.mouseEventToLayerPoint(e);

		if (this._startLayerPoint.equals(layerPoint)) { return; }

		var bounds = new EzServerClient.LatLngBounds(
		        map.layerPointToLatLng(this._startLayerPoint),
		        map.layerPointToLatLng(layerPoint));

		map.fitBounds(bounds);

		map.fire('boxzoomend', {
			boxZoomBounds: bounds
		});
	},

	_onKeyDown: function (e) {
		if (e.keyCode === 27) {
			this._finish();
		}
	}
});

EzServerClient.Map.addInitHook('addHandler', 'boxZoom', EzServerClient.Map.BoxZoom);


/*
 * EzServerClient.Map.Keyboard is handling keyboard interaction with the map, enabled by default.
 */

EzServerClient.Map.mergeOptions({
	keyboard: true,
	keyboardPanOffset: 80,
	keyboardZoomOffset: 1
});

EzServerClient.Map.Keyboard = EzServerClient.Handler.extend({

	keyCodes: {
		left:    [37],
		right:   [39],
		down:    [40],
		up:      [38],
		zoomIn:  [187, 107, 61, 171],
		zoomOut: [189, 109, 173]
	},

	initialize: function (map) {
		this._map = map;

		this._setPanOffset(map.options.keyboardPanOffset);
		this._setZoomOffset(map.options.keyboardZoomOffset);
	},

	addHooks: function () {
		var container = this._map._container;

		// make the container focusable by tabbing
		if (container.tabIndex === -1) {
			container.tabIndex = '0';
		}

		EzServerClient.DomEvent
		    .on(container, 'focus', this._onFocus, this)
		    .on(container, 'blur', this._onBlur, this)
		    .on(container, 'mousedown', this._onMouseDown, this);

		this._map
		    .on('focus', this._addHooks, this)
		    .on('blur', this._removeHooks, this);
	},

	removeHooks: function () {
		this._removeHooks();

		var container = this._map._container;

		EzServerClient.DomEvent
		    .off(container, 'focus', this._onFocus, this)
		    .off(container, 'blur', this._onBlur, this)
		    .off(container, 'mousedown', this._onMouseDown, this);

		this._map
		    .off('focus', this._addHooks, this)
		    .off('blur', this._removeHooks, this);
	},

	_onMouseDown: function () {
		if (this._focused) { return; }

		var body = document.body,
		    docEl = document.documentElement,
		    top = body.scrollTop || docEl.scrollTop,
		    left = body.scrollLeft || docEl.scrollLeft;

		this._map._container.focus();

		window.scrollTo(left, top);
	},

	_onFocus: function () {
		this._focused = true;
		this._map.fire('focus');
	},

	_onBlur: function () {
		this._focused = false;
		this._map.fire('blur');
	},

	_setPanOffset: function (pan) {
		var keys = this._panKeys = {},
		    codes = this.keyCodes,
		    i, len;

		for (i = 0, len = codes.left.length; i < len; i++) {
			keys[codes.left[i]] = [-1 * pan, 0];
		}
		for (i = 0, len = codes.right.length; i < len; i++) {
			keys[codes.right[i]] = [pan, 0];
		}
		for (i = 0, len = codes.down.length; i < len; i++) {
			keys[codes.down[i]] = [0, pan];
		}
		for (i = 0, len = codes.up.length; i < len; i++) {
			keys[codes.up[i]] = [0, -1 * pan];
		}
	},

	_setZoomOffset: function (zoom) {
		var keys = this._zoomKeys = {},
		    codes = this.keyCodes,
		    i, len;

		for (i = 0, len = codes.zoomIn.length; i < len; i++) {
			keys[codes.zoomIn[i]] = zoom;
		}
		for (i = 0, len = codes.zoomOut.length; i < len; i++) {
			keys[codes.zoomOut[i]] = -zoom;
		}
	},

	_addHooks: function () {
		EzServerClient.DomEvent.on(document, 'keydown', this._onKeyDown, this);
	},

	_removeHooks: function () {
		EzServerClient.DomEvent.off(document, 'keydown', this._onKeyDown, this);
	},

	_onKeyDown: function (e) {
		var key = e.keyCode,
		    map = this._map;

		if (key in this._panKeys) {

			if (map._panAnim && map._panAnim._inProgress) { return; }

			map.panBy(this._panKeys[key]);

			if (map.options.maxBounds) {
				map.panInsideBounds(map.options.maxBounds);
			}

		} else if (key in this._zoomKeys) {
			map.setZoom(map.getZoom() + this._zoomKeys[key]);

		} else {
			return;
		}

		EzServerClient.DomEvent.stop(e);
	}
});

EzServerClient.Map.addInitHook('addHandler', 'keyboard', EzServerClient.Map.Keyboard);


/*
 * EzServerClient.Handler.MarkerDrag is used internally by EzServerClient.Marker to make the markers draggable.
 */

EzServerClient.Handler.MarkerDrag = EzServerClient.Handler.extend({
	initialize: function (marker) {
		this._marker = marker;
	},

	addHooks: function () {
		var icon = this._marker._icon;
		if (!this._draggable) {
			this._draggable = new EzServerClient.Draggable(icon, icon);
		}

		this._draggable
			.on('dragstart', this._onDragStart, this)
			.on('drag', this._onDrag, this)
			.on('dragend', this._onDragEnd, this);
		this._draggable.enable();
		EzServerClient.DomUtil.addClass(this._marker._icon, 'leaflet-marker-draggable');
	},

	removeHooks: function () {
		this._draggable
			.off('dragstart', this._onDragStart, this)
			.off('drag', this._onDrag, this)
			.off('dragend', this._onDragEnd, this);

		this._draggable.disable();
		EzServerClient.DomUtil.removeClass(this._marker._icon, 'leaflet-marker-draggable');
	},

	moved: function () {
		return this._draggable && this._draggable._moved;
	},

	_onDragStart: function () {
		this._marker
		    .closePopup()
		    .fire('movestart')
		    .fire('dragstart');
	},

	_onDrag: function () {
		var marker = this._marker,
		    shadow = marker._shadow,
		    iconPos = EzServerClient.DomUtil.getPosition(marker._icon),
		    latlng = marker._map.layerPointToLatLng(iconPos);

		// update shadow position
		if (shadow) {
			EzServerClient.DomUtil.setPosition(shadow, iconPos);
		}

		marker._latlng = latlng;

		marker
		    .fire('move', {latlng: latlng})
		    .fire('drag');
	},

	_onDragEnd: function (e) {
		this._marker
		    .fire('moveend')
		    .fire('dragend', e);
	}
});


Circle = EzServerClient.Class.extend({
	initialize : function(points, color, weight, opacity, fillcolor) {
		var tempArr = points.split(",");
		var circleCenter = [ tempArr[1], tempArr[0] ], radius = tempArr[2];

		this.uCircle = EzServerClient.circle(circleCenter, radius, {
			color : color,
			weight : weight,
			fillOpacity : opacity,
			fillColor : fillcolor
		});
	},
	
	addTo:function(map){
		this.uCircle.addTo(map);
	},

	getMBR: function() {
		var bounds = this.uCircle.getBounds();

		return bounds;
	},

	getSelf:function(){
		return this.uCircle;
	},
	
	getCenter:function(){
		return this.uCircle.getLatLng();
	},
	
	getRadius:function(){
		return this.uCircle.getRadius();
	},
	
	openInfoWindowHtml:function(strHTML){
		this.uCircle.bindPopup(strHTML);
	},
	
	closeInfoWindowHtml:function(){
		this.uCircle.unbindPopup();
	}
});

Point = function(x,y){
	if (x instanceof EzServerClient.Point) {
		return x;
	}
	if (EzServerClient.Util.isArray(x)) {
		return new EzServerClient.Point(x[0], x[1]);
	}
	if (typeof x === 'string') {
		var temp = x.split(',');
		return new EzServerClient.Point(temp[0],temp[1]);
	}
	if (x === undefined || x === null) {
		return x;
	}
	return new EzServerClient.Point(x, y);
}

//Client方法增加到leaflet Point中107~126

Polyline = EzServerClient.Class.extend({
	initialize: function(points, color, weight, opacity) {
		this.uPolyline = new EzServerClient.Polyline(points, {
			color: color,
			weight: weight,
			opacity: opacity
		});
	},

	addListener: function(action, func) {
		this.uPolyline.on(action, func);
	},

	closeInfoWindowHtml: function() {
		this.uPolyline.unbindPopup();
	},

	getColor: function() {
		return this.uPolyline.options.color;
	},

	getCoordSequence: function() {
		var latlngs = this.uPolyline.getLatLngs(),
			latlngString = "";
		for (var i = 0; i < latlngs.length; i++) {
			latlngString += latlngs[i].lat + "," + latlngs[i].lng;
			if (i != latlngs.length - 1) {
				latlngString += ',';
			}
		}
		return latlngString;
	},

	getGeometryType: function() {
		return "Polyline";
	},

	//补充
	getLength: function() {

	},

	getLineStyle: function() {

	},

	getMBR: function() {
		return this.uPolyline.getBounds();
	},

	getPoints: function() {
		return this.uPolyline.getLatLngs();
	},

	getWidth: function() {
		return this.uPolyline.options.weight;
	},

	getZIndex: function() {

	},

	openInfoWindowHtml: function(strHTML) {
		this.uPolyline.bindPopup(strHTML);
	},

	setColor: function(color) {
		this.uPolyline.options.color = color;

		if (this.uPolyline._container) {
			this.uPolyline._updateStyle();
		}
	},

	setLineStyle: function() {

	},

	setPoints: function(points) {
		this.uPolyline.setLatLngs(points);
	},

	setWidth: function(weight) {
		this.uPolyline.options.weight = weight;

		if (this.uPolyline._container) {
			this.uPolyline._updateStyle();
		}
	},

	setZIndex: function() {

	},

	addTo:function(map){
		this.uPolyline.addTo(map);
	}
});

Polygon = EzServerClient.Class.extend({
	initialize: function(points, color, weight, opacity, fillcolor) {
		this.uPolygon = new EzServerClient.Polygon(points, {
			color: color,
			weight: weight,
			fillOpacity: opacity,
			fillColor: fillcolor
		});
	},

	addListener: function(action, func) {
		this.uPolygon.on(action, func);
	},

	closeInfoWindowHtml: function() {
		this.uPolygon.unbindPopup();
	},

	getArea: function() {
		console.log("未实现!");
	},

	getFillColor: function() {
		return this.uPolygon.options.fillColor;
	},

	getFillOpacity: function() {
		return this.uPolygon.options.fillOpacity;
	},

	getGeometryType: function() {
		return "Polygon";
	},

	getLength: function() {
		console.log("未实现!");
	},

	getMBR: function() {
		return this.uPolygon.getBounds();
	},

	getZIndex: function() {
		console.log("未实现！");
	},

	openInfoWindowHtml: function(strHTML) {
		this.uPolygon.bindPopup(strHTML);
	},

	setFillColor: function(color) {
		this.uPolygon.options.fillColor = color;

		if (this.uPolygon._container) {
			this.uPolygon._updateStyle();
		}
	},

	setFillOpacity: function(opacity) {
		this.uPolygon.options.fillOpacity = opacity;

		if (this.uPolygon._container) {
			this.uPolygon._updateStyle();
		}
	},

	setZIndex: function() {
		console.log("未实现！");
	},

	getPoints: function() {
		return this.uPolygon.getLatLngs();
	},

	addTo: function(map) {
		this.uPolygon.addTo(map);
	},

	setColor: function(color) {
		this.uPolygon.options.color = color;

		if (this.uPolygon._container) {
			this.uPolygon._updateStyle();
		}
	},

	getColor: function() {
		return this.uPolygon.options.color;
	},

	getCoordSequence: function() {
		var latlngs = this.uPolygon.getLatLngs(),
			latlngString = "";
		for (var i = 0; i < latlngs.length; i++) {
			latlngString += latlngs[i].lat + "," + latlngs[i].lng;
			if (i != latlngs.length - 1) {
				latlngString += ',';
			}
		}
		return latlngString;
	}
});

MultiPoint = EzServerClient.Class.extend({
	initialize: function(vCoordSequence) {
		this.uMultiPoint = new Array();

		var tempArray = vCoordSequence.split(",");
		if (tempArray.length % 2 === 0) {
			for (var i = 0; i < tempArray.length; i++) {
				this.uMultiPoint.push(EzServerClient.point(tempArray[i], tempArray[i + 1]));
				i++;
			};
		}
	},

	addSegment: function(vPoint) {
		this.uMultiPoint.push(EzServerClient.point(vPoint));
	},

	addSegments: function(vCoordSequence) {
		var tempArray = vCoordSequence.split(",");
		if (tempArray.length % 2 === 0) {
			for (var i = 0; i < tempArray.length; i++) {
				this.uMultiPoint.push(EzServerClient.point(tempArray[i], tempArray[i + 1]));
				i++;
			};
		}
	},

	getCenter: function() {
		var tempArray = this.uMultiPoint.slice(0);

		tempArray.sort(function(a,b){
			return (b.x - a.x) && (b.y - a.y);
		});

		return tempArray[tempArray.length / 2 - 1];
	},

	getCoordSequence: function() {
		var uCoordSequence = "";

		for (var i = 0; i < this.uMultiPoint.length; i++) {
			uCoordSequence += this.uMultiPoint[i].getCoordSequence();
			if (i != this.uMultiPoint.length - 1) {
				uCoordSequence += ", ";
			}
		}

		return uCoordSequence;
	},

	getGeometryType: function() {
		return "MultiPoint";
	},

	getMBR: function() {
		return new EzServerClient.Bounds(this.uMultiPoint);
	},

	getSegment: function(index) {
		return this.uMultiPoint[index];
	},

	getSegmentCount: function() {
		return this.uMultiPoint.length;
	},

	getSegments: function() {
		return this.uMultiPoint;
	},

	setCoordSequence: function() {
		console.log("再测试！");
	}
});

MultiPolyline = EzServerClient.Class.extend({
	initialize: function(vCoordSequence, color, weight, opacity) {
		var tempArray = vCoordSequence.split(";");
		var PolylineArr = new Array();

		for (var i = 0; i < tempArray.length; i++) {
			var polylineTemp = tempArray[i].split(",");
			var polyline = new Array();
			for (var j = 0; j < polylineTemp.length; j++) {
				polyline.push(EzServerClient.latLng(polylineTemp[j], polylineTemp[j + 1]));
				j++;
			}
			PolylineArr.push(polyline); 
		}
		this.uMultiPolyline = new EzServerClient.MultiPolyline(PolylineArr,{
			color: color,
			weight: weight,
			opacity: opacity
		});
	},

	addTo: function(map) {
		this.uMultiPolyline.addTo(map);
	},

	addSegment: function(vCoordSequence) {
		var polylineArr = vCoordSequence.split(","),
			polyline = new Array();

		for (var i = 0; i < polylineArr.length; i++) {
			polyline.push(EzServerClient.latLng(polylineArr[i], polylineArr[i + 1]));
			i++;
		}

		var tempArr = new Array();
		tempArr.push(polyline);
		var temp = this.uMultiPolyline.getLatLngs().concat(tempArr);
		this.uMultiPolyline.setLatLngs(temp);

	},

	addSegments: function(vCoordSequence) {
		var tempArray = vCoordSequence.split(";");
		var PolylineArr = new Array();

		for (var i = 0; i < tempArray.length; i++) {
			var polylineTemp = tempArray[i].split(",");
			var polyline = new Array();
			for (var j = 0; j < polylineTemp.length; j++) {
				polyline.push(EzServerClient.latLng(polylineTemp[j], polylineTemp[j + 1]));
				j++;
			}
			PolylineArr.push(polyline);
		}

		this.uMultiPolyline.setLatLngs(this.uMultiPolyline.getLatLngs().concat(PolylineArr));
	},

	getCenter: function() {
		return this.uMultiPolyline.getBounds().getCenter();
	},

	getCoordSequence: function() {
		var tempArr = this.uMultiPolyline.getLatLngs(),
			coordString = "";

		for (var i = 0; i < tempArr.length; i++) {
			for (var j = 0; j < tempArr[i].length; j++) {
				coordString += tempArr[i][j].lat + " , " + tempArr[i][j].lng;

				if (j != tempArr[i].length - 1) {
					coordString += " , ";
				}
			}

			coordString += " ; ";
		}

		return coordString;
	},

	getGeometryType: function() {
		return "MultiPolyline";
	},

	getMBR: function() {
		return this.uMultiPolyline.getBounds();
	},

	getSegment: function(index) {
		if (index < 0 && index > this.uMultiPolyline.getLatLngs().length - 1) {
			console.log("index 溢出!")
			return 
		}

		return this.uMultiPolyline.getLatLngs()[index];
	},

	getSegmentCount: function() {
		return this.uMultiPolyline.getLatLngs().length;
	},

	getSegments: function() {
		return this.uMultiPolyline.getLatLngs();
	},

	setCoordSequence: function(vCoordSequence) {
		var tempArray = vCoordSequence.split(";");
		var PolylineArr = new Array();

		for (var i = 0; i < tempArray.length; i++) {
			var polylineTemp = tempArray[i].split(",");
			var polyline = new Array();
			for (var j = 0; j < polylineTemp.length; j++) {
				polyline.push(EzServerClient.latLng(polylineTemp[j], polylineTemp[j + 1]));
				j++;
			}
			PolylineArr.push(polyline);
		}

		this.uMultiPolyline.setLatLngs(PolylineArr);
	}
});

MultiPolygon = EzServerClient.Class.extend({
	initialize: function(vCoordSequence, color, weight, opacity, fillcolor) {
		var tempArray = vCoordSequence.split(";");
		var PolygonArr = new Array();

		for (var i = 0; i < tempArray.length; i++) {
			var polygonTemp = tempArray[i].split(",");
			var polygon = new Array();
			for (var j = 0; j < polygonTemp.length; j++) {
				polygon.push(EzServerClient.latLng(polygonTemp[j], polygonTemp[j + 1]));
				j++;
			}
			PolygonArr.push(polygon);
		}
		this.uMultiPolygon = new EzServerClient.MultiPolygon(PolygonArr,{
			color: color,
			weight: weight,
			fillOpacity: opacity,
			fillColor: fillcolor
		});
	},

	addTo: function(map) {
		this.uMultiPolygon.addTo(map);
	},

	addSegment: function(vCoordSequence) {
		var coordArr = vCoordSequence.split(","),
			polygon = new Array();

		for (var i = 0; i < coordArr.length; i++) {
			polygon.push(EzServerClient.latLng(coordArr[i], coordArr[i + 1]));
			i++;
		}

		var tempArr = new Array();
		tempArr.push(polygon);
		var temp = this.uMultiPolygon.getLatLngs().concat(tempArr);
		this.uMultiPolygon.setLatLngs(temp);
	},

	addSegments: function(vCoordSequence) {
		var polygonTempArr = vCoordSequence.split(";");
		var polygonArr = new Array();

		for (var i = 0; i < polygonTempArr.length; i++) {
			var coordArr = polygonTempArr[i].split(",");
			var polygon = new Array();
			for (var j = 0; j < coordArr.length; j++) {
				polygon.push(EzServerClient.latLng(coordArr[j], coordArr[j + 1]));
				j++;
			}
			polygonArr.push(polygon);
		}

		this.uMultiPolygon.setLatLngs(this.uMultiPolygon.getLatLngs().concat(polygonArr));
	},

	getCenter: function() {
		return this.uMultiPolygon.getBounds().getCenter();
	},

	getCoordSequence: function() {
		var tempArr = this.uMultiPolygon.getLatLngs(),
			coordString = "";

		for (var i = 0; i < tempArr.length; i++) {
			for (var j = 0; j < tempArr[i].length; j++) {
				coordString += tempArr[i][j].lat + " , " + tempArr[i][j].lng;

				if (j != tempArr[i].length - 1) {
					coordString += " , ";
				}
			}

			coordString += " ; ";
		}

		return coordString;
	},

	getGeometryType: function() {
		return "MultiPolygon";
	},

	getMBR: function() {
		return this.uMultiPolygon.getBounds();
	},

	getSegment: function(index) {
		if (index < 0 && index > this.uMultiPolygon.getLatLngs().length - 1) {
			console.log("index 溢出!")
			return 
		}

		return this.uMultiPolygon.getLatLngs()[index];
	},

	getSegmentCount: function() {
		return this.uMultiPolygon.getLatLngs().length;
	},

	getSegments: function() {
		return this.uMultiPolygon.getLatLngs();
	},

	setCoordSequence: function(vCoordSequence) {
		var tempArray = vCoordSequence.split(";");
		var PolylineArr = new Array();

		for (var i = 0; i < tempArray.length; i++) {
			var polylineTemp = tempArray[i].split(",");
			var polyline = new Array();
			for (var j = 0; j < polylineTemp.length; j++) {
				polyline.push(EzServerClient.latLng(polylineTemp[j], polylineTemp[j + 1]));
				j++;
			}
			PolylineArr.push(polyline);
		}

		this.uMultiPolygon.setLatLngs(PolylineArr);
	}
});

Rectangle = Polygon.extend({
	initialize: function(points, color, weight, opacity, fillcolor) {
		var coordArr = points.split(","),
			bounds = new Array();

		if (coordArr.length != 4) {
			return ;
		}

		bounds.push(EzServerClient.latLng(coordArr[0],coordArr[1]));
		bounds.push(EzServerClient.latLng(coordArr[0],coordArr[3]));
		bounds.push(EzServerClient.latLng(coordArr[2],coordArr[3]));
		bounds.push(EzServerClient.latLng(coordArr[2],coordArr[1]));

		this.uRect = new EzServerClient.Polygon(bounds, {
			color: color,
			weight: weight,
			fillOpacity: opacity,
			fillColor: fillcolor
		});
	},

	addTo:function(map){
		this.uRect.addTo(map);
	},

	addListener: function(action, func) {
		this.uRect.on(action, func);
	},

	closeInfoWindowHtml: function() {
		this.uRect.unbindPopup();
	},

	getZIndex: function() {

	},

	openInfoWindowHtml: function(strHTML) {
		this.uRect.bindPopup(strHTML);
	},

	setZIndex: function() {

	}
});

MBR = EzServerClient.Class.extend({
	initialize: function(minX, minY, maxX, maxY) {
		this.uMBR = new EzServerClient.LatLngBounds(EzServerClient.latLng(minY,minX), EzServerClient.latLng(maxY, maxX));
	},

	statics: {
		intersection: function() {},

		union: function() {}
	},

	centerPoint: function() {
		var latlng = this.uMBR.getCenter(),
			point = new Point(latlng.lng,latlng.lat);
		return point;
	},

	containsBounds: function(pMBR) {
		return this.uMBR.contains(pMBR.uMBR);
	},

	containsPoint: function(point) {
		var latlng = EzServerClient.latLng(point.y,point.x);
		return this.uMBR.contains(latlng);
	},

	extend: function(pMBRorPoint) {
		return this.uMBR.extend(EzServerClient.latLng(pMBRorPoint));
	},

	getCenterPoint: function() {
		return this.uMBR.getCenter();
	},

	getSpanX: function() {
		return Math.abs(this.uMBR.getWest()-this.uMBR.getEast());
	},

	getSpanY: function() {
		return Math.abs(this.uMBR.getNorth()-this.uMBR.getSouth());
	},

	scale: function(e) {
		this.uMBR.pad(e);
	}
});

EzServerClient.Layer = EzServerClient.Class.extend({
	
});

EzServerClient.Layer.GoogleTileLayer = EzServerClient.Layer.extend({
	initialize: function(name, url) {
		this.layer = EzServerClient.tileLayer(url);
		this.name = name;
	},

	addTo: function(map) {
		if (!map.uMap.isEzMap) {
			map.uMap.options.crs = EzServerClient.CRS.EPSG3857;
			map.uMap.options.isEzMap = false;
			map.uMap.setView(map.uMap.getCenter(), map.uMap.getZoom());
			this.layer.addTo(map.uMap);
		}
		else{
			this.layer.addTo(map.uMap);
		}	
	}
})

EzServerClient.Layer.EzMapTileLayer2010 = EzServerClient.Layer.extend({
	initialize: function(name, url) {
		this.layer = EzServerClient.tileLayer.EzMap(url);
		this.name = name;
	},

	addTo: function(map) {
			map.uMap.options.crs = EzServerClient.CRS.EPSG4326Ez;
			map.uMap.options.isEzMap = true;
			map.uMap.setView(map.uMap.getCenter(), map.uMap.getZoom());
			this.layer.addTo(map.uMap);
	}
});

EzMap = EzServerClient.Class.extend({
	statics:{
		addVersion:function(strVersion){
		},
		
		registerProx:function(strProxyURL){
			EzServerClient.Map.proxyURL2EzMapService=strProxyURL;
		},

		/**
		 * [initialize description]
		 * @param  {a,b} id [���뾭γ�����꣨�й���ϰ�ߣ�]������/[a,b]/a,b
		 * @return {[point]}    [latlng(������ϰ��)]
		 */
		pointCoorType: function(x, y) {
			if (x instanceof EzServerClient.latLng) {
				return new EzServerClient.LatLng(x.lng,x.lat);
			}
			if (EzServerClient.Util.isArray(x)) {
				return new EzServerClient.LatLng(x[1], x[0]);
			}
			if (x === undefined || x === null) {
				return x;
			}
			return new EzServerClient.LatLng(y, x);
		}
	},

	initialize: function(id) {
		var crsCollction = {
			"Ez":EzServerClient.CRS.EPSG4326Ez,
			"3857":EzServerClient.CRS.EPSG3857,
			"4326":EzServerClient.CRS.EPSG4326,
			"3395":EzServerClient.CRS.EPSG3395
		};
		
		var crsobj = crsCollction[ezMap.MapSrcURL[0][2].crs];
		
		this.uMap = new EzServerClient.Map(id,{
			center: EzMap.pointCoorType(ezMap.CenterPoint[0], ezMap.CenterPoint[1]),
			crs: crsobj,
			zoom: ezMap.MapInitLevel,
			isEzMap: ezMap.TileAnchorPoint,
			zoomsliderControl: false,
			navButtonControl: false,
			minZoom: ezMap.MapMinLevel,
			maxZoom: ezMap.MapMaxLevel,
			zoomAnimation:true
		});
		
		//Ĭ������һ����Ƭͼ��
		//ͨ�����ò�������ͼ������
		var layers = ezMap.MapSrcURL;
		var ezMapLayers = this.ezMapLayers =  {};
		var crs;

		if (layers.length > 1) {			
			for (var i = 0; i < layers.length; i++) {
				crs = this.stringToCrs(layers[i][2]);
				ezMapLayers[layers[i][0]] = EzServerClient.tileLayer(layers[i][1],crs);
			}
		}
		else{
			crs = this.stringToCrs(layers[0][2]);
			ezMapLayers.tileLayerObject = EzServerClient.tileLayer(layers[0][1],layers[0][2]);
			ezMapLayers.tileLayerName = layers[0][0];
		}

		// var shijieUrl = 'http://172.25.16.129:7001/EzServer6_v6.6.12.201403271015/Maps/shijie/EzMap?Service=getImage&Type=RGB&Col={x}&Row={y}&Zoom={z}&V=0.3';
		// // var shijieUrl = mapConfig.url;
		// this.shijie = EzServerClient.tileLayer.EzMap(shijieUrl);
		// this.strVersion="1.0";
		
		return this.uMap;
	},

	stringToCrs:function(jsonObj){
		var newObj = {};
		for (var i in jsonObj){
			if (i!=="crs") {
				newObj[i] = jsonObj[i];
			}
			else{
				var newcrs = this.crsdelivery(jsonObj[i]);
				newObj[i] = newcrs;
			}
		}
		return newObj;
	},

	crsdelivery:function(p){
		switch(p){
			case "Ez": 
				return EzServerClient.CRS.EPSG4326Ez;
			case "4326":
				return EzServerClient.CRS.EPSG4326;
			default:
				return EzServerClient.CRS.EPSG3857;
		}
	},
	
	initialize2:function(){
		if (ezMap.MapSrcURL.length > 1) {
			if (ezMap.layersControlStyle === 1) {
				EzServerClient.control.layers(this.ezMapLayers).addTo(this.uMap);
				for (var i in this.ezMapLayers){
					this.uMap.addLayer(this.ezMapLayers[i]);
					this.ezMapLayers[i].bringToBack();
					break;
				}
			}
			else {
				var layers = ezMap.MapSrcURL;
				for (var j = 0 ;j < layers.length; j++){
					var tempLayer = EzServerClient.tileLayer(layers[j][1],layers[j][2]);
					EzServerClient.layersButton(layers[j][0], this.uMap, tempLayer);
					if (j === 0 ) {
						this.uMap.addLayer(tempLayer);
					}
				}
			}	
		}
		else{
			this.ezMapLayers.tileLayerObject.addTo(this.uMap);
		}
	},
	
	//qianleyi control slider2 baidu
	showMapControl:function(){
		var isOnMap = true;
		if (!this.uMap.zoomsliderControl) {
			isOnMap = false;
			this.uMap.zoomsliderControl = EzServerClient.control.zoomslider2();
		}
		if (!isOnMap) {
			this.uMap.addControl(this.uMap.zoomsliderControl);
		}
	},
	
	getLMap:function(){
		return this.uMap;
	},
	
	addOverView:function(ov){
		var isOnMap = true;
		this.uMap.eachLayer(function(layer){
			if (layer._url) {
				ov.miniMap._layer = layer.clone();
			}
		});

		ov.miniMap.options.width = ov.width;
		ov.miniMap.options.height = ov.height;

		if (!this.uMap.miniMapControl) {
			this.uMap.miniMapControl = ov.miniMap;
			isOnMap = false;
		}
		if (!isOnMap) {
			ov.miniMap.addTo(this.uMap);
		}

		//qianleyi ʹminimapһ��ʼ�ɹر�״̬
		ov.miniMap._userToggledDisplay = true;
		ov.miniMap._minimize();
		ov.miniMap._toggleDisplayButton.title = this.showText;

	},
	
	zoomIn:function(){
		this.uMap.zoomIn();
	},
	
	zoomOut:function(){
		this.uMap.zoomOut();
	},
	
	gotoCenter:function(lng,lat){
		if (lng && lat) {
			var centerPoint = EzServerClient.latLng(lat,lng);
			this.uMap.panTo(centerPoint);
		}
		else{
			this.uMap.panTo(EzMap.pointCoorType(ezMap.CenterPoint[0], ezMap.CenterPoint[1]));
		}
	},
	
	fullExtent:function(lng,lat,level){
		if (lng && lat) {
			var centerPoint = EzServerClient.latLng(lat,lng);
			if (level) {
				this.uMap.setView(centerPoint,level);
			}
			else{
				this.uMap.setView(centerPoint,ezMap.MapInitLevel);
			}
		}
		else{
			this.uMap.setView(EzMap.pointCoorType(ezMap.CenterPoint[0], ezMap.CenterPoint[1]),ezMap.MapInitLevel);
		}
	},
	
	centerAndZoom:function(point,zoomLevel){
		var latlng = EzServerClient.latLng(point.y,point.x);
		this.uMap.setView(latlng,zoomLevel);
	},
	
	addMapEventListener:function(eventType, handler){
		if (eventType === "whenReady") {
			this.uMap.whenReady(handler);
		}
 		else {
			this.uMap.on(eventType, handler);
		}
		return eventsobj = {
			action:eventType,
			handler:handler
		};
	},
	
	//����������������
	addOverlay:function(voverlay){
		voverlay.addTo(this.uMap);
	},
	
	changeDragMode:function(drawMode,input1,input2,callback){
		switch(drawMode){
			case "drawPoint":
				this._drawPoint(callback);
				break;
			case "measure":
				this._measureTool(callback);
				break;
			case "drawPolyline":
				this._drawPolyline(callback);
				break;
			case "drawRect":
				this._drawRect(callback);
				break;
			case "drawPolygon":
				this._drawPolygon(callback);
				break;
			case "drawCircle":
				this._drawCircle(callback);
				break;
			default:
				break;
		}
	},
	
	_drawPoint:function(callback){
		this.uMap.getContainer().style.cursor = 'crosshair';
		var output = callback;
		
		var that = this;
		this.uMap.on("click",_drawPoint);
		
		/* Draw Point Event Function*/
		function _drawPoint(e){
			that.uMap.getContainer().style.cursor = '';
			var drawPointLatLng = e.latlng;
			that.uMap.off("click",_drawPoint);
			output(drawPointLatLng);
		}
	},

	_measureTool: function(callback) {
		this.uMap.getContainer().style.cursor = 'crosshair';
		var _drawing = true;
		var output = callback;
		var _poly = new EzServerClient.Polyline([],{
			weight: 3,
			opacity: 0.8,
			color:"#517CB7",
			dashArray: "10,10"
		});
		_poly.addTo(this.uMap);
		var that = this;

		this.uMap.on("click", _measureClick);
		this.uMap.on("contextmenu", _measureContextmenu);
		this.uMap.on("mousemove", _measureMove);

		/**
		 * measure event method
		 */
		function _measureClick(e){
			if (_drawing) {
				_poly.addLatLng(e.latlng);
			}
		}
		function _measureMove(e){
			if (_poly.getLatLngs().length !== 0 ) {
				if (_poly.getLatLngs().length !== 1) {
					var index = _poly.getLatLngs().length - 1;
					_poly.spliceLatLngs(index , 1);
					_poly.addLatLng(e.latlng);
				}
				else{
					_poly.addLatLng(e.latlng);
				}	
			}
		}
		function _measureContextmenu(){
			that.uMap.getContainer().style.cursor = '';
			_drawing = false;
			that.uMap.off("click", _measureClick);
			that.uMap.off("mousemove", _measureMove);
			var index = _poly.getLatLngs().length - 1;
			_poly.spliceLatLngs(index , 1);
			that.uMap.off("contextmenu", _measureContextmenu);

			var latlngs = _poly.getLatLngs(),
				distancesum = 0;
			for (var i = 0; i < latlngs.length - 1; i++) {
				distancesum = distancesum + latlngs[i].distanceTo(latlngs[i + 1]);
			}

			var distanceStr = null;
			if (distancesum  > 1000) {
				distanceStr = (distancesum  / 1000).toFixed(2) + ' km';
			} else {
				distanceStr = Math.ceil(distancesum) + ' m';
			}
			output(distanceStr);

		}
	},

	_drawPolyline: function(callback) {
		this.uMap.getContainer().style.cursor = 'crosshair';
		var _drawing = true;
		var output = callback;
		var _poly = new EzServerClient.Polyline([],{
			weight: 3,
			opacity: 0.8,
			color:"#517CB7"
		});
		_poly.addTo(this.uMap);
		var that = this;

		this.uMap.on("click", _measureClick);
		this.uMap.on("contextmenu", _measureContextmenu);
		this.uMap.on("mousemove", _measureMove);

		/**
		 * drawLine event method
		 */
		function _measureClick(e){
			if (_drawing) {
				_poly.addLatLng(e.latlng);
			}
		}
		function _measureMove(e){
			if (_poly.getLatLngs().length !== 0 ) {
				if (_poly.getLatLngs().length !== 1) {
					var index = _poly.getLatLngs().length - 1;
					_poly.spliceLatLngs(index , 1);
					_poly.addLatLng(e.latlng);
				}
				else{
					_poly.addLatLng(e.latlng);
				}	
			}
		}
		function _measureContextmenu(){
			that.uMap.getContainer().style.cursor = '';
			_drawing = false;
			that.uMap.off("click", _measureClick);
			that.uMap.off("mousemove", _measureMove);
			var index = _poly.getLatLngs().length - 1;
			_poly.spliceLatLngs(index , 1);
			that.uMap.off("contextmenu", _measureContextmenu);
			if (output !== undefined) {
				output(_poly);
			}
		}
	},

	_drawRect: function(callback) {
		this.uMap.dragging.disable();
		this.uMap.getContainer().style.cursor = 'crosshair';
		var _drawing = false;
		var output = callback;
		var _rect = null;
		var that = this;

		this.uMap.on("mousedown", _drawRectClick);
		this.uMap.on("mousemove", _drawRectMove);
		this.uMap.on("mouseup", _drawRectUp);

		/**
		 * drawRect event method
		 */
		var topLeftPoint = null;
		function _drawRectClick(e){
			topLeftPoint = e.latlng;
			var bounds = EzServerClient.latLngBounds([topLeftPoint,topLeftPoint]);
			_rect = new EzServerClient.Rectangle(bounds,{
				weight: 3,
				opacity: 0.8,
				color:"#517CB7"
			});
			_rect.addTo(that.uMap);
			_drawing = true;
		}
		function _drawRectMove(e){
			if (_drawing) {
				_rect.setBounds(EzServerClient.latLngBounds([topLeftPoint,e.latlng]));
			}
		}
		function _drawRectUp(e){
			_rect.setBounds(EzServerClient.latLngBounds([topLeftPoint,e.latlng]));
			that.uMap.getContainer().style.cursor = '';
			that.uMap.off("mousedown", _drawRectClick);
			that.uMap.off("mousemove", _drawRectMove);
			that.uMap.off("mouseup", _drawRectUp);
			that.uMap.dragging.enable();
			if (output !== undefined) {
				output(_rect);
			}	
		}
	},

	_drawPolygon :function(callback) {
		this.uMap.getContainer().style.cursor = 'crosshair';
		var _drawing = true;
		var output = callback;
		var _poly = new EzServerClient.Polygon([],{
			weight: 3,
			opacity: 0.8,
			color:"#517CB7"
		});
		_poly.addTo(this.uMap);
		var that = this;

		this.uMap.on("click", _drawPolygonClick);
		this.uMap.on("contextmenu", _drawPolygonContextmenu);
		this.uMap.on("mousemove", _drawPolygonMove);

		/**
		 * drawLine event method
		 */
		function _drawPolygonClick(e){
			if (_drawing) {
				_poly.addLatLng(e.latlng);
			}
		}
		function _drawPolygonMove(e){
			if (_poly.getLatLngs().length !== 0 ) {
				if (_poly.getLatLngs().length !== 1) {
					var index = _poly.getLatLngs().length - 1;
					_poly.spliceLatLngs(index , 1);
					_poly.addLatLng(e.latlng);
				}
				else{
					_poly.addLatLng(e.latlng);
				}	
			}
		}
		function _drawPolygonContextmenu(e){
			that.uMap.getContainer().style.cursor = '';
			_drawing = false;
			that.uMap.off("click", _drawPolygonClick);
			that.uMap.off("mousemove", _drawPolygonMove);
			var index = _poly.getLatLngs().length - 1;
			_poly.spliceLatLngs(index , 1);
			that.uMap.off("contextmenu", _drawPolygonContextmenu);
			if (output !== undefined) {
				output(_poly);
			}

		}
	},

	_drawCircle:function(callback) {
		this.uMap.dragging.disable();
		this.uMap.getContainer().style.cursor = 'crosshair';
		var _drawing = false;
		var output = callback;
		var _circle = null;
		var that = this;

		this.uMap.on("mousedown", _drawCircleClick);
		this.uMap.on("mousemove", _drawCircleMove);
		this.uMap.on("mouseup", _drawCircleUp);

		/**
		 * drawRect event method
		 */
		var centerPoint = null;
		function _drawCircleClick(e){
			centerPoint = e.latlng;
			_circle = new EzServerClient.Circle(centerPoint,0,{
				weight: 3,
				opacity: 0.8,
				color:"#517CB7"
			});
			_circle.addTo(that.uMap);
			_drawing = true;
		}
		function _drawCircleMove(e){
			if (_drawing) {
				var distance = centerPoint.distanceTo(e.latlng);
				_circle.setRadius(distance);
			}
		}
		function _drawCircleUp(e){
			_drawing = false;
			var distance = centerPoint.distanceTo(e.latlng);
			_circle.setRadius(distance);
			that.uMap.getContainer().style.cursor = '';
			that.uMap.off("mousedown", _drawCircleClick);
			that.uMap.off("mousemove", _drawCircleMove);
			that.uMap.off("mouseup", _drawCircleUp);
			that.uMap.dragging.enable();
			if (output !== undefined) {
				output(_circle);
			}	
		}
	},
	
	centerAtLatLng: function(point) {
		var latlng = EzServerClient.latLng(point.y,point.x);
		this.uMap.setView(latlng, this.uMap.getZoom());
	},
	
	centerAtMBR:function(a,b,c,d){
		if (a instanceof EzServerClient.Point) {
			var latlng1 = EzServerClient.latLng(a.y,a.x),
				latlng2 = EzServerClient.latLng(b.y,b.x);
			var bounds = EzServerClient.latLngBounds(latlng1,latlng2);
		}
		else if(a instanceof EzServerClient.LatLngBounds){
			var bounds = a;
		}
		else{
			var latlng1 = EzServerClient.latLng(b,a), 
				latlng2 = EzServerClient.latLng(d,c);
			var bounds = EzServerClient.latLngBounds(latlng1,latlng2);	
		}
		
		this.uMap.fitBounds(bounds);
	},
	
	//������ͼ�ϵĻ��ƺͼ����Ķ���
	clear:function(){
		this.uMap.eachLayer(function(layer){
			if (!(layer instanceof EzServerClient.TileLayer)) {
				this.removeLayer(layer);
			}
		},this.uMap);
	},
	
	//�������տռ���ѯ��������
	clearLayers:function(){
		
	},
	
	//�����������еĵ�ͼ״̬�任��Ϣ�¼�
	clearMapChangeListener:function(){
		
	},
	
	//���յ�ͼ�����������Զ����¼�����
	clearMapEventListeners:function(){
		this.uMap.clearAllEventListeners();
	},
	
	//���յ�ͼ����������ָ���¼������¼�����
	clearMapInstanceEventListeners:function(eventType){
		this.uMap.removeEventListener(eventType);
	},
	
	//�ڵ�ͼ��ɾ�����еĵ��Ӷ���
	clearOverlays:function(bForcedRemove){
		
	},
	
	//�ر�EzMap::openInfoWindow���򿪵���Ϣ�� 
	closeInfoWindow:function(){
		
	},
	
	//�ڵ���ͼǰ�����£�����ͼ�����е���������ֵת���ɵ�ͼ���� 
	containerCoord2Map:function(point){
		var layerPoint=this.uMap.containerPointToLayerPoint(point);
		return this.uMap.layerPointToLatLng(layerPoint);
	},
	
	//ȡ����ͼ�������ַ���ʱ������λ��Ϊ���ķ���Ч�������Ե�ͼ����λ�÷���ԭ��
	disableMouseZoom:function(){
		this.uMap.scrollWheelZoom.disable();
	},
	
	//�����϶�����Ϊ������
	disableSlipPan:function(){
		this.uMap.dragging.disable();
	},
	
	//ͨ������ͼƬ�ľ��η�Χ��������ͼƬ���ط�ʽ�����ص�ͼͼƬ,��������һ��pngͼƬ�������ؼ����͵�ͼ��Χ����һ���ߴ�����ʱ��һ��Ϊ������Ļ�ߴ�ʱ���˹�����Ч��
	downloadMap:function(minx, miny, maxx, maxy, iLevel, format){
		alert("�޴��룡");
	},
	
	//ͨ��ʸ����ͼ������������Դ�ı༭����Ҫ��EzMapAPI.js�л�������EditObject::serviceSource����������EzMapService������
	//EzMapService���������ĵ��÷���
	edit:function(editObj, callback){
		alert("�޴��룡");
	},
	
	//���õ�ͼ�������ַ���ʱ������λ��Ϊ���ķ�����^disableMouseZoom��
	enableMouseZoom:function(){
		this.uMap.scrollWheelZoom.enable();
	},
	
	//�����϶�����Ϊ����
	enableSlipPan:function(){
		this.uMap.dragging.enable();
	},
	
	//��ȡ��ǰ�Ӵ��ı߿�����Ӧ�ĵ�ͼȫͼ��Χ
	getBoundsLatLng:function(){
		return this.uMap.getBounds();
	},
	
	//���õ�ͼ���ĵ�����
	getCenterLatLng:function(){
		return this.uMap.getCenter();
	},
	
	//��ȡ��ǰ�༭�Ķ���
	//��֪��
	getCurrentEditor:function(){
		
	},
	
	//���õ�ǰ��ͼ�����ߣ�1:***�������磺1:50000 
	//��֪����leafletû��zoom��Ӧ��
	getCurrentMapScale:function(){
		
	},
	
	//���ô��������µĿ��ȣ�������������Ϊ1000 �ף����������ݸ������ڵ����ϵ�λ�÷���һ������ֵ����λΪ�ȣ�
	//��֪�����Ժ󲹳�
	getDegree: function(pPoint, dMeter) {
		var dDegree = 1,
			temp = parseFloat(pPoint.x) + dDegree;
		var pPoint1 = new Point([temp.toString(), pPoint.y]);
		var p1 = EzServerClient.latLng(pPoint.y, pPoint.x),
			p2 = EzServerClient.latLng(pPoint1.y, pPoint1.x);
		var dMeter1 = p1.distanceTo(p2);
		var dResult = dDegree * dMeter / dMeter1;
		return dResult;
	},
	
	//��ȡ��ǰ����ģʽ
	//��֪�����Ժ󲹳�
	getDragMode:function(){
		
	},
	
	//��ȡ����EzMapService���������Դ�����Ĭ�����Դ���Ϊ1��
	//��֪�����Ժ󲹳�
	getEzMapServiceTryTimes:function(){
		
	},
	
	//��ȡָ���ķ�Χ�ļ���
	//��֪��,��̫���������ܵ���˼
	getLevelOfMBR:function(dInMinX, dInMinY, dInMaxX, dInMaxY){
		
	},
	
	//����ת�ص�ͼ������
	getMapContainer:function(){
		return this.uMap.getContainer();
	},
	
	//��ȡ��ͼ�����󼶱�
	getMaxLevel:function(){
		return this.uMap.getMaxZoom();
	},
	
	//���þ�γ�������µĿ��ȣ�������������Ϊ0.01 �ȣ����������ݸ������ڵ����ϵ�λ�÷���һ������ֵ����λΪ�ף�
	//��֪��,��̫���������ܵ���˼
	getMeter:function(point, degree){
		
	},
	
	//���������ڵ�ͼ��X�����ϵ�����ֵ����λΪ��ͼĬ�ϵ�λ��
	//��֪��������Ӧ�ù��������¼�
	getMouseMapX:function(){
		
	},
	
	//���������ڵ�ͼ��Y�����ϵ�����ֵ����λΪ��ͼĬ�ϵ�λ��
	//��֪��������Ӧ�ù��������¼�
	getMouseMapY:function(){
		
	},
	
	//��ȡ��ͼ���û����ӵļ��ζ��󣬱�ע������ר��ͼ����
	getOverlays:function(){
		return this.uMap.getPanes().overlayPane.childNodes;
	},
	
	//���ò�ѯ�������ϵĿ�¡
	getQueryResult:function(){
		return this.uMap.getQueryResult();
	},
	
	//��ȡ��ǰ�Ӵ��Ŀ���
	getSpanLatLng:function(){
		var extent = this.uMap.getBounds();

		var span = {
			width: Math.abs(extent.getSouthEast().lng - extent.getNorthWest().lng),
			height: Math.abs(extent.getSouthEast().lat - extent.getNorthWest().lat)
		};

		return span;
	},
	
	//��ʾ���еĵ�ͼ�汾�����б�ʹ��","�ŷָ�
	getVersionInfo:function(){
		return EzServerClient.version;
	},
	
	//��ȡ��ͼ�ĵ�ǰ����
	getZoomLevel:function(){
		return this.uMap.getZoom();
	},
	
	//���ذ�Ȩ��Ϣ
	hideCopyright:function(){
		this._prefixAttributions=this.uMap.attributionControl.options.prefix;
		this.uMap.attributionControl.options.prefix="";
		this.uMap.attributionControl._update();
	},
	
	//���ص�ͼ�����ؼ�������һ����ͼ�ؼ����򻯵�ͼ�ؼ��ͱ�׼��ͼ�ؼ�
	hideMapControl:function(){
		if (this.uMap.navButtonControl !== undefined) {this.uMap.removeControl(this.uMap.navButtonControl);}
		if (this.uMap.zoomsliderControl !== undefined) {this.uMap.removeControl(this.uMap.zoomsliderControl);}
		if (this.uMap.zoomControl !== undefined) {this.uMap.removeControl(this.uMap.zoomControl);}
	},
	
	//���ر�������Ϣ
	//��֪������������1:project����
	hideMapScale:function(){
		
	},
	
	//���ص�ͼ���Ͻ��Ͻǵ�ͼ������ť
	//��֪������������
	hideMapServer:function(){
		
	},
	
	//����ӥ��
	hideOverView:function(){
		this.uMap.miniMapControl._minimize();
		this.uMap.miniMapControl._toggleDisplayButton.title = this.showText;
	},
	
	//�ڵ���ͼǰ�����£�����ͼ���껻�ɵ�ͼ�����е���������
	mapCoord2Container:function(point){
		this.uMap.latLngToContainerPoint(point);
	},
	
	//���õ�ͼ����״̬Ϊ��������״̬
	//�ص�����ԭ�ͣ�callback(vStrMeasureArea)
	//vStrMeasureArea {String} : �������ز���������
	measureArea:function(callback){
		
	},
	
	//���õ�ͼ����״̬Ϊ����״̬
	//��֪��
	measureLength:function(){
		
	},
	
	//�ڵ�ͼָ��λ����ʾ��Ϣ
	//��֪������������
	openInfoWindow:function(point, strHTML, bIsInScreen){
		
	},
	
	//ͨ��ʸ����ͼ�������в�ѯ���磺�ռ���ѯ�����Բ�ѯ��
	query:function(queryObj, callback){
		this.uMap.query(queryObj, callback);
	},
	
	//���е�ָ���ĵ㣬�����õ��ڵ�ǰ��ͼ�ϣ�������ƽ�Ƶ��õ�Ϊ��ͼ����
	recenterOrPanToLatLng:function(point){
		this.uMap.setView(point,this.uMap.getZoom());
	},
	
	//ˢ�µ�ͼ
	refresh:function(){
		this.uMap.invalidateSize();
	},
	
	//ɾ��ָ����ͼ��������
	removeGroupLayer:function(){
		
	},
	
	//ע����ͼ�¼�����
	removeMapEventListener:function(eventsobj){
		var eventType = eventsobj.action,
			handler = eventsobj.handler;

		this.uMap.off(eventType, handler);
	},
	
	//�ڵ�ͼ��ɾ��ָ���ĵ��Ӷ���
	removeOverlay:function(overlay){
		this.uMap.removeLayer(overlay.getSelf());
	},
	
	//���õ�ͼ�����а����Ŀռ�����ͼ��
	setEzLayer:function(pEzLayerArr){
		
	},
	
	//���õ���EzMapService����ʱ�����Դ�����Ĭ�����Դ���Ϊ1��
	setEzMapServiceTryTimes:function(vTimes){
		this.uMap.setEzMapServiceTryTimes(vTimes);
	},
	
	//��ʾ��Ȩ��Ϣ�ڵ�ͼ�ؼ������½�
	showCopyright:function(){
		this.uMap.attributionControl.options.prefix=this._prefixAttributions;
		this.uMap.attributionControl._update();
	},
	
	//��ʾ��������Ϣ�ڵ�ͼ�����½�
	//��֪������������
	showMapScale:function(){
		
	},
	
	//��ʾ��ͼ���Ͻ��Ͻǵ�ͼ������ť
	//��֪������������
	showMapServer:function(){
		
	},
	
	//��ʾ�򻯵�ͼ�ؼ����򻯵�ͼ���ƿؼ��������Ŵ�һ�򼶱���ť����Сһ�򼶱���ť�����ϡ��������������ºͶ��а�ť
	showSmallMapControl:function(){
		var isOnMap = true;
		if (!this.uMap.navButtonControl && !this.uMap.zoomControl) {
			isOnMap = false;
			this.uMap.navButtonControl = EzServerClient.control.navButton2();
			this.uMap.zoomControl = EzServerClient.control.zoom();
		}
		if (!isOnMap) {
			this.uMap.addControl(this.uMap.navButtonControl);
			this.uMap.addControl(this.uMap.zoomControl);
		}
	},
	
	//��ʾ��׼��ͼ�ؼ�����׼��ͼ���ƿؼ�������С��ͼ���ƿؼ����ϸ��򼶱���ť
	showStandMapControl:function(){
		var isOnMap = true;
		if (!this.uMap.navButtonControl && !this.uMap.zoomsliderControl) {
			isOnMap = false;
			this.uMap.navButtonControl = EzServerClient.control.navButton2();
			this.uMap.zoomsliderControl = EzServerClient.control.zoomslider2();
		}
		if (!isOnMap) {
			this.uMap.addControl(this.uMap.navButtonControl);
			this.uMap.addControl(this.uMap.zoomsliderControl);
		}
	},
	
	//��ʾĳ�汾�ĵ�ͼ
	showVersion:function(){
		
	},

	showOverView: function() {
		this.uMap.miniMapControl._restore();
		this.uMap.miniMapControl._toggleDisplayButton.title = this.hideText;
	},
	
	//��ͼ��ָ�������з��񣬼��˵��ڵ�ͼ���Ź�����λ�ò���
	zoomAtPoint:function(oPoint, nZoomLevel){
		this.uMap.setView(oPoint, nZoomLevel);
	},
	
	//ͨ���û��ڵ�ͼ�Ͻ����Ļ��ƾ��Σ��Ե�ͼ���зŴ󡣺���ִ�к���ԭʼ��������ʧȥ���㣬������Ϊ��ͼ�ؼ�
	zoomInExt:function(){
		this.uMap.dragging.disable();

		this.topLeftOfBounds = null;
		this.rectangle = null;

		this.uMap.getContainer().style.cursor = "default";

		this.uMap.on("mousedown",this._dragRectDown);
		this.uMap.on("mousemove",this._dragRectMove);
		this.uMap.on("mouseup",this._dragRectUp);

		var that = this;
		this.uMap.on("zoomend",function() {
			this.off("mousedown",this._dragRectDown);
			this.off("mousemove",this._dragRectMove);
			this.off("mouseup",this._dragRectUp);

			that.topLeftOfBounds = null;
			that.rectangle = null;
			this.dragging.enable();
			this.getContainer().style.cursor = "";
		});
	},

	_dragRectDown: function(e) {
		this.topLeftOfBounds = e.latlng;
		this.rectangle = new EzServerClient.Rectangle(EzServerClient.latLngBounds(this.topLeftOfBounds,this.topLeftOfBounds),{
			weight: 4,
			opacity: 0.7,
			fillOpacity: 0,
			color:"#77AB50",
			dashArray: "10,10"
		}).addTo(this);
	},

	_dragRectMove: function(e) {
		if (!this.topLeftOfBounds || this.topLeftOfBounds === null) {return;}
		this.rectangle.setBounds(EzServerClient.latLngBounds(this.topLeftOfBounds,e.latlng));
	},

	_dragRectUp: function(e) {
		this.removeLayer(this.rectangle);
		var rightBottomOfBounds = e.latlng;
		this.fitBounds(EzServerClient.latLngBounds(this.topLeftOfBounds,rightBottomOfBounds));
	},
	
	//ͨ���û��ڵ�ͼ�Ͻ����Ļ��ƾ��Σ��Ե�ͼ������С������ִ�к���ԭʼ��������ʧȥ���㣬������Ϊ��ͼ�ؼ�
	zoomOutExt:function(){
		//  �����Ϲ淶
	},
	
	zoomTo:function(zoomLevel){
		this.uMap.setView(this.uMap.getCenter(),zoomLevel);
	}
});

OverView = EzServerClient.Class.extend({
	initialize : function() {
		this.miniMap = new EzServerClient.Control.MiniMap("",{
			toggleDisplay : true
		});
	}
})

Icon = EzServerClient.Icon.extend({
	initialize : function() {
		this.height=null;
		this.width=null;
		this.image=null;
		this.leftOffset=null;
		this.topOffset=null;
	},
	
	update:function(){
		this.options.iconUrl=this.image;
		this.options.iconSize=new EzServerClient.Point(this.width, this.height);
	}
});

Marker = EzServerClient.Class.extend({
	initialize: function(point, icon, title){
		var params = arguments,
			latlng = EzServerClient.latLng(params[0].y,params[0].x),
			uicon = params[1],
			title = params[2];

		this.uMarker = EzServerClient.marker(latlng);
		
		if (uicon !== undefined) {
			this.uMarker.setIcon(icon);
		}

		if (title !== undefined) {
			this.uMarker.bindTitle(title);
		}
	},
	
	openInfoWindowHtml: function(strHTML){
		if (!this.uMarker.getPopup()) {
			this.uMarker.bindPopup(strHTML);
			this.uMarker.openPopup();
		}
		else{
			this.uMarker.closePopup();
			this.uMarker.unbindPopup();
			this.uMarker.bindPopup(strHTML);
			this.uMarker.openPopup();
		}
	},
	
	closeInfoWindowHtml:function(){
		this.uMarker.closePopup();
		this.uMarker.unbindPopup();
	},
	
	addListener:function(action, func){
		this.uMarker.on(action,func);
	},

	getPoint:function(){
		return this.uMarker.getLatLng();
	},

	getSelf:function(){
		return this.uMarker;
	},

	setPoint:function(point){
		var latlng = EzServerClient.latLng(point.y,point.x);
		this.uMarker.setLatLng(latlng);
	},

	showTitle:function(){
		this.uMarker.showTitle();
	},

	hideTitle:function(){
		this.uMarker.hideTitle();
	},

	addTo:function(map){
		this.uMarker.addTo(map);
	}
});

HTMLElementOverLay = EzServerClient.Class.extend({
	initialize: function(id, LeftTopMapPoint, strHTML) {
		var divicon = EzServerClient.divIcon({
			className: id,
			html: strHTML,
			iconSize: null,
			iconAnchor: [0,0]
		});

		var _latlng = EzServerClient.latLng(LeftTopMapPoint.y, LeftTopMapPoint.x);
		this._marker = EzServerClient.marker(_latlng,{icon:divicon});
	},

	addTo: function(map) {
		this._marker.addTo(map);
	},

	addListener:function(action, func){
		this._marker.on(action,func);
	},

	getSelf:function(){
		return this._marker;
	},
});

Title = EzServerClient.Class.extend({
	options:{
		fontSize:10,
		font: '宋体',
		color: 'white',
		bgColor: '#015190',
		borderColor: 'black',
		borderSize: 1,
		bIsTransparent:false,
		borderStyle:'solid',
		offset: [-15,-45],
		zoomAnimation: true
	},

	initialize: function(name,options) {
		
		this._content = name;

		EzServerClient.setOptions(this, options);

		this._animated = EzServerClient.Browser.any3d && this.options.zoomAnimation;
		this._isOpen = false;
	},

	onAdd:function(map){
		this._map = map;

		this._pane = map._panes.markerPane;

		if (!this._container) {
			this._initLayout();
		}

		this._updateStyle();
		this._pane.appendChild(this._container);

		this._update();

		this.setOpacity(this.options.opacity);

		map
			.on('moveend', this._onMoveEnd, this)
			.on('viewreset', this._onViewReset, this);

		if (this._animated) {
			map.on('zoomanim', this._zoomAnimation, this);
		}
	},

	_updateStyle:function(){
		var container = this._container,
			style = container.style;

		style.fontSize = this.options.fontSize + 'pt';
		style.fontFamily = this.options.font;

		style.borderColor = this.options.borderColor;
		style.borderWidth = this.options.borderSize + 'px';
		style.borderStyle = this.options.borderStyle;

		style.backgroundColor = this.options.bgColor;
		style.color = this.options.color;
	},

	_onMoveEnd: function(){
		if (!this._animated) {
			this._updatePosition();
		}
	},

	_onViewReset: function(e){
		this._update();
	},

	_zoomAnimation: function(opt){
		var pos = this._map._latLngToNewLayerPoint(this._latlng, opt.zoom, opt.center).round();

		this._setPosition(pos);
	},

	_update:function(){
		if (!this._map) { return; }

		this._container.style.visibility = 'hidden';

		this._updateContent();
		this._updatePosition();

		this._container.style.visibility = '';
	},

	onRemove: function (map) {
		this._pane.removeChild(this._container);

		map.off({
			zoomanim: this._zoomAnimation,
			moveend: this._onMoveEnd,
			viewreset: this._onViewReset
		}, this);

		this._map = null;
	},

	_updateContent:function(){
		if (!this._content || !this._map || this._prevContent === this._content) {
			return;
		}

		if (typeof this._content === 'string') {
			this._container.innerHTML = this._content;

			this._prevContent = this._content;

			this._labelWidth = this._container.offsetWidth;
		}
	},

	_initLayout: function(){
		this._container = EzServerClient.DomUtil.create('div', 'EzServerClient-Title leaflet-zoom-animated');
		this.updateZIndex(this._zIndex);
	},

	setOpacity: function (opacity) {
		this.options.opacity = opacity;

		if (this._container) {
			EzServerClient.DomUtil.setOpacity(this._container, opacity);
		}
	},

	updateZIndex:function(zIndex){
		this._zIndex = zIndex;

		if (this._container && this._zIndex) {
			this._container.style.zIndex = zIndex;
		}
	},

	setLatLng:function(latlng){
		this._latlng = EzServerClient.latLng(latlng);
		if (this._map) {
			this._updatePosition();
		}
		return this;
	},

	_updatePosition:function(){
		var pos = this._map.latLngToLayerPoint(this._latlng);

		this._setPosition(pos);
	},

	_setPosition:function(pos){
		var container = this._container,
			offset = EzServerClient.point(this.options.offset);

		pos = pos.add(offset);

		EzServerClient.DomUtil.setPosition(container, pos);
	},

	setContent:function(content){
		// Backup previous content and store new content
		this._previousContent = this._content;
		this._content = content;

		this._updateContent();

		return this;
	},

	close:function(){
		var map = this._map;

		if (map) {
			map.removeLayer(this);
		}
	}
});

EzServerClient.Marker.include({
	bindTitle:function(title){
		if(!this.title){
			if (typeof title === 'string') {
				this.title.setContent(title);
			}
			else{		
				this.title = title;
			}
		}
		else{
			this.title.setContent(content);
		}
	},

	showTitle: function(){
		if (this.title && this._map) {
			this.title.setLatLng(this._latlng);
			this._map.showTitle(this.title);
		}

		return this;
	},
	
	hideTitle: function(){
		if (this.title) {
			this.title.close();
		}
		return this;
	}
});

EzServerClient.Map.include({
	showTitle:function(title){
		return this.addLayer(title);
	}
});

EzEvent = EzServerClient.Class.extend({
	statics:{
		MAP_ADDOVERLAY:"overlayadd",
		MAP_CLEAROVERLAYS:"overlayremove",
		MAP_CLICK:"click",
		MAP_DBLCLICK:"dblclick",
		MAP_MOUSEDOWN:"mousedown",
		MAP_MOUSEMOVE:"mousemove",
		MAP_MOUSEOUT:"mouseout",
		MAP_MOUSEOVER:"mouseover",
		MAP_MOUSEUP:"mouseup",
		MAP_MOUSEWHEEL:"",
		MAP_PAN:"drag",
		MAP_PANEND:"dragend",
		MAP_PANSTART:"dragstart",
		MAP_READY:"load",
		MAP_REMOVEOVERLAY:"overlayremove",
		MAP_RESIZE:"resize",
		MAP_SWITCHMAPSERVER:"baselayerchange",
		MAP_ZOOMCHANGE:"zoomlevelschange",
		MAP_ZOOMEND:"zoomend",
		MAP_ZOOMSTART:"zoomstart"
	}
});

EzServerClient.GroupLayer = EzServerClient.Class.extend({
	initialize: function(name, ulayers) {
		this.name = name;
		this.layers = {};
		for (var i = 0; i < ulayers.length; i++) {
			var tempName = ulayers[i].name,
				tempLayer = ulayers[i].layer;
			Object.defineProperty(this.layers,tempName,{
				value: tempLayer,
    			writable: true,
    			enumerable: true,
    			configurable: true
			});
		}

		this.groupControl = EzServerClient.control.layers(this.layers);
	},

	addTo:function(map){
		this.groupControl.addTo(map.uMap);
	}
});

/*
 * heatmap.js v2.0.0 | JavaScript Heatmap Library
 *
 * Copyright 2008-2014 Patrick Wied <heatmapjs@patrick-wied.at> - All rights reserved.
 * Dual licensed under MIT and Beerware license 
 *
 * :: 2014-09-04 17:52
 */
;(function(global){ 
// Heatmap Config stores default values and will be merged with instance config
var HeatmapConfig = {
  defaultRadius: 40,
  defaultRenderer: 'canvas2d',
  defaultGradient: { '0.25': "rgb(0,0,255)", '0.55': "rgb(0,255,0)", '0.85': "yellow", '1.0': "rgb(255,0,0)"},
  defaultMaxOpacity: 1,
  defaultMinOpacity: 0,
  defaultBlur: .85,
  defaultXField: 'x',
  defaultYField: 'y',
  defaultValueField: 'value', 
  plugins: {}
};
var Store = (function StoreClosure() {

  var Store = function Store(config) {
    this._coordinator = {};
    this._data = [];
    this._radi = [];
    this._min = 0;
    this._max = 1;
    this._xField = config['xField'] || config.defaultXField;
    this._yField = config['yField'] || config.defaultYField;
    this._valueField = config['valueField'] || config.defaultValueField;

    if (config["radius"]) {
      this._cfgRadius = config["radius"];
    }
  };

  var defaultRadius = HeatmapConfig.defaultRadius;

  Store.prototype = {
    // when forceRender = false -> called from setData, omits renderall event
    _organiseData: function(dataPoint, forceRender) {
        var x = dataPoint[this._xField];
        var y = dataPoint[this._yField];
        var radi = this._radi;
        var store = this._data;
        var max = this._max;
        var min = this._min;
        var value = dataPoint[this._valueField] || 1;
        var radius = dataPoint.radius || this._cfgRadius || defaultRadius;

        if (!store[x]) {
          store[x] = [];
          radi[x] = [];
        }

        if (!store[x][y]) {
          store[x][y] = value;
          radi[x][y] = radius;
        } else {
          store[x][y] += value;
        }

        if (store[x][y] > max) {
          if (!forceRender) {
            this._max = store[x][y];
          } else {
            this.setDataMax(store[x][y]);
          }
          return false;
        } else{
          return { 
            x: x, 
            y: y,
            value: value, 
            radius: radius,
            min: min,
            max: max 
          };
        }
    },
    _unOrganizeData: function() {
      var unorganizedData = [];
      var data = this._data;
      var radi = this._radi;

      for (var x in data) {
        for (var y in data[x]) {

          unorganizedData.push({
            x: x,
            y: y,
            radius: radi[x][y],
            value: data[x][y]
          });

        }
      }
      return {
        min: this._min,
        max: this._max,
        data: unorganizedData
      };
    },
    _onExtremaChange: function() {
      this._coordinator.emit('extremachange', {
        min: this._min,
        max: this._max
      });
    },
    addData: function() {
      if (arguments[0].length > 0) {
        var dataArr = arguments[0];
        var dataLen = dataArr.length;
        while (dataLen--) {
          this.addData.call(this, dataArr[dataLen]);
        }
      } else {
        // add to store  
        var organisedEntry = this._organiseData(arguments[0], true);
        if (organisedEntry) {
          this._coordinator.emit('renderpartial', {
            min: this._min,
            max: this._max,
            data: [organisedEntry]
          });
        }
      }
      return this;
    },
    setData: function(data) {
      var dataPoints = data.data;
      var pointsLen = dataPoints.length;


      // reset data arrays
      this._data = [];
      this._radi = [];

      for(var i = 0; i < pointsLen; i++) {
        this._organiseData(dataPoints[i], false);
      }
      this._max = data.max;
      this._min = data.min || 0;
      
      this._onExtremaChange();
      this._coordinator.emit('renderall', this._getInternalData());
      return this;
    },
    removeData: function() {
      // TODO: implement
    },
    setDataMax: function(max) {
      this._max = max;
      this._onExtremaChange();
      this._coordinator.emit('renderall', this._getInternalData());
      return this;
    },
    setDataMin: function(min) {
      this._min = min;
      this._onExtremaChange();
      this._coordinator.emit('renderall', this._getInternalData());
      return this;
    },
    setCoordinator: function(coordinator) {
      this._coordinator = coordinator;
    },
    _getInternalData: function() {
      return { 
        max: this._max,
        min: this._min, 
        data: this._data,
        radi: this._radi 
      };
    },
    getData: function() {
      return this._unOrganizeData();
    }/*,

      TODO: rethink.

    getValueAt: function(point) {
      var value;
      var radius = 100;
      var x = point.x;
      var y = point.y;
      var data = this._data;

      if (data[x] && data[x][y]) {
        return data[x][y];
      } else {
        var values = [];
        // radial search for datapoints based on default radius
        for(var distance = 1; distance < radius; distance++) {
          var neighbors = distance * 2 +1;
          var startX = x - distance;
          var startY = y - distance;

          for(var i = 0; i < neighbors; i++) {
            for (var o = 0; o < neighbors; o++) {
              if ((i == 0 || i == neighbors-1) || (o == 0 || o == neighbors-1)) {
                if (data[startY+i] && data[startY+i][startX+o]) {
                  values.push(data[startY+i][startX+o]);
                }
              } else {
                continue;
              } 
            }
          }
        }
        if (values.length > 0) {
          return Math.max.apply(Math, values);
        }
      }
      return false;
    }*/
  };


  return Store;
})();

var Canvas2dRenderer = (function Canvas2dRendererClosure() {
  
  var _getColorPalette = function(config) {
    var gradientConfig = config.gradient || config.defaultGradient;
    var paletteCanvas = document.createElement('canvas');
    var paletteCtx = paletteCanvas.getContext('2d');

    paletteCanvas.width = 256;
    paletteCanvas.height = 1;

    var gradient = paletteCtx.createLinearGradient(0, 0, 256, 1);
    for (var key in gradientConfig) {
      gradient.addColorStop(key, gradientConfig[key]);
    }

    paletteCtx.fillStyle = gradient;
    paletteCtx.fillRect(0, 0, 256, 1);

    return paletteCtx.getImageData(0, 0, 256, 1).data;
  };

  var _getPointTemplate = function(radius, blurFactor) {
    var tplCanvas = document.createElement('canvas');
    var tplCtx = tplCanvas.getContext('2d');
    var x = radius;
    var y = radius;
    tplCanvas.width = tplCanvas.height = radius*2;

    if (blurFactor == 1) {
      tplCtx.beginPath();
      tplCtx.arc(x, y, radius, 0, 2 * Math.PI, false);
      tplCtx.fillStyle = 'rgba(0,0,0,1)';
      tplCtx.fill();
    } else {
      var gradient = tplCtx.createRadialGradient(x, y, radius*blurFactor, x, y, radius);
      gradient.addColorStop(0, 'rgba(0,0,0,1)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      tplCtx.fillStyle = gradient;
      tplCtx.fillRect(0, 0, 2*radius, 2*radius);
    }
    
    

    return tplCanvas;
  };

  var _prepareData = function(data) {
    var renderData = [];
    var min = data.min;
    var max = data.max;
    var radi = data.radi;
    var data = data.data;
    
    var xValues = Object.keys(data);
    var xValuesLen = xValues.length;

    while(xValuesLen--) {
      var xValue = xValues[xValuesLen];
      var yValues = Object.keys(data[xValue]);
      var yValuesLen = yValues.length;
      while(yValuesLen--) {
        var yValue = yValues[yValuesLen];
        var value = data[xValue][yValue];
        var radius = radi[xValue][yValue];
        renderData.push({
          x: xValue,
          y: yValue,
          value: value,
          radius: radius
        });
      }
    }

    return {
      min: min,
      max: max,
      data: renderData
    };
  };


  function Canvas2dRenderer(config) {
    var container = config.container;
    var shadowCanvas = this.shadowCanvas = document.createElement('canvas');
    var canvas = this.canvas = config.canvas || document.createElement('canvas');
    var renderBoundaries = this._renderBoundaries = [10000, 10000, 0, 0];

    var computed = getComputedStyle(config.container) || {};

    canvas.className = 'heatmap-canvas';

    this._width = canvas.width = shadowCanvas.width = +(computed.width.replace(/px/,''));
    this._height = canvas.height = shadowCanvas.height = +(computed.height.replace(/px/,''));

    this.shadowCtx = shadowCanvas.getContext('2d');
    this.ctx = canvas.getContext('2d');

    // @TODO:
    // conditional wrapper

    canvas.style.cssText = shadowCanvas.style.cssText = 'position:absolute;left:0;top:0;';

    container.style.position = 'relative';
    container.appendChild(canvas);

    this._palette = _getColorPalette(config);
    this._templates = {};

    this._setStyles(config);
  };

  Canvas2dRenderer.prototype = {
    renderPartial: function(data) {
      this._drawAlpha(data);
      this._colorize();
    },
    renderAll: function(data) {
      // reset render boundaries
      this._clear();
      this._drawAlpha(_prepareData(data));
      this._colorize();
    },
    _updateGradient: function(config) {
      this._palette = _getColorPalette(config);
    },
    updateConfig: function(config) {
      if (config['gradient']) {
        this._updateGradient(config);
      }
      this._setStyles(config);
    },
    setDimensions: function(width, height) {
      this._width = width;
      this._height = height;
      this.canvas.width = this.shadowCanvas.width = width;
      this.canvas.height = this.shadowCanvas.height = height;
    },
    _clear: function() {
      this.shadowCtx.clearRect(0, 0, this._width, this._height);
      this.ctx.clearRect(0, 0, this._width, this._height);
    },
    _setStyles: function(config) {
      this._blur = (config.blur == 0)?0:(config.blur || config.defaultBlur);

      if (config.backgroundColor) {
        this.canvas.style.backgroundColor = config.backgroundColor;
      }

      this._opacity = (config.opacity || 0) * 255;
      this._maxOpacity = (config.maxOpacity || config.defaultMaxOpacity) * 255;
      this._minOpacity = (config.minOpacity || config.defaultMinOpacity) * 255;
      this._useGradientOpacity = !!config.useGradientOpacity;
    },
    _drawAlpha: function(data) {
      var min = this._min = data.min;
      var max = this._max = data.max;
      var data = data.data || [];
      var dataLen = data.length;
      // on a point basis?
      var blur = 1 - this._blur;

      while(dataLen--) {

        var point = data[dataLen];

        var x = point.x;
        var y = point.y;
        var radius = point.radius;
        // if value is bigger than max
        // use max as value
        var value = Math.min(point.value, max);
        var rectX = x - radius;
        var rectY = y - radius;
        var shadowCtx = this.shadowCtx;




        var tpl;
        if (!this._templates[radius]) {
          this._templates[radius] = tpl = _getPointTemplate(radius, blur);
        } else {
          tpl = this._templates[radius];
        }
        // value from minimum / value range
        // => [0, 1]
        shadowCtx.globalAlpha = (value-min)/(max-min);

        shadowCtx.drawImage(tpl, rectX, rectY);

        // update renderBoundaries
        if (rectX < this._renderBoundaries[0]) {
            this._renderBoundaries[0] = rectX;
          } 
          if (rectY < this._renderBoundaries[1]) {
            this._renderBoundaries[1] = rectY;
          }
          if (rectX + 2*radius > this._renderBoundaries[2]) {
            this._renderBoundaries[2] = rectX + 2*radius;
          }
          if (rectY + 2*radius > this._renderBoundaries[3]) {
            this._renderBoundaries[3] = rectY + 2*radius;
          }

      }
    },
    _colorize: function() {
      var x = this._renderBoundaries[0];
      var y = this._renderBoundaries[1];
      var width = this._renderBoundaries[2] - x;
      var height = this._renderBoundaries[3] - y;
      var maxWidth = this._width;
      var maxHeight = this._height;
      var opacity = this._opacity;
      var maxOpacity = this._maxOpacity;
      var minOpacity = this._minOpacity;
      var useGradientOpacity = this._useGradientOpacity;

      if (x < 0) {
        x = 0;
      }
      if (y < 0) {
        y = 0;
      }
      if (x + width > maxWidth) {
        width = maxWidth - x;
      }
      if (y + height > maxHeight) {
        height = maxHeight - y;
      }

      var img = this.shadowCtx.getImageData(x, y, width, height);
      var imgData = img.data;
      var len = imgData.length;
      var palette = this._palette;


      for (var i = 3; i < len; i+= 4) {
        var alpha = imgData[i];
        var offset = alpha * 4;


        if (!offset) {
          continue;
        }

        var finalAlpha;
        if (opacity > 0) {
          finalAlpha = opacity;
        } else {
          if (alpha < maxOpacity) {
            if (alpha < minOpacity) {
              finalAlpha = minOpacity;
            } else {
              finalAlpha = alpha;
            }
          } else {
            finalAlpha = maxOpacity;
          }
        }

        imgData[i-3] = palette[offset];
        imgData[i-2] = palette[offset + 1];
        imgData[i-1] = palette[offset + 2];
        imgData[i] = useGradientOpacity ? palette[offset + 3] : finalAlpha;

      }

      img.data = imgData;
      this.ctx.putImageData(img, x, y);

      this._renderBoundaries = [1000, 1000, 0, 0];

    },
    getValueAt: function(point) {
      var value;
      var shadowCtx = this.shadowCtx;
      var img = shadowCtx.getImageData(point.x, point.y, 1, 1);
      var data = img.data[3];
      var max = this._max;
      var min = this._min;

      value = (Math.abs(max-min) * (data/255)) >> 0;

      return value;
    },
    getDataURL: function() {
      return this.canvas.toDataURL();
    }
  };


  return Canvas2dRenderer;
})();

var Renderer = (function RendererClosure() {

  var rendererFn = false;

  if (HeatmapConfig['defaultRenderer'] === 'canvas2d') {
    rendererFn = Canvas2dRenderer;
  }

  return rendererFn;
})();


var Util = {
  merge: function() {
    var merged = {};
    var argsLen = arguments.length;
    for (var i = 0; i < argsLen; i++) {
      var obj = arguments[i]
      for (var key in obj) {
        merged[key] = obj[key];
      }
    }
    return merged;
  }
};
// Heatmap Constructor
var Heatmap = (function HeatmapClosure() {

  var Coordinator = (function CoordinatorClosure() {

    function Coordinator() {
      this.cStore = {};
    };

    Coordinator.prototype = {
      on: function(evtName, callback, scope) {
        var cStore = this.cStore;

        if (!cStore[evtName]) {
          cStore[evtName] = [];
        }
        cStore[evtName].push((function(data) {
            return callback.call(scope, data);
        }));
      },
      emit: function(evtName, data) {
        var cStore = this.cStore;
        if (cStore[evtName]) {
          var len = cStore[evtName].length;
          for (var i=0; i<len; i++) {
            var callback = cStore[evtName][i];
            callback(data);
          }
        }
      }
    };

    return Coordinator;
  })();


  var _connect = function(scope) {
    var renderer = scope._renderer;
    var coordinator = scope._coordinator;
    var store = scope._store;

    coordinator.on('renderpartial', renderer.renderPartial, renderer);
    coordinator.on('renderall', renderer.renderAll, renderer);
    coordinator.on('extremachange', function(data) {
      scope._config.onExtremaChange &&
      scope._config.onExtremaChange({
        min: data.min,
        max: data.max,
        gradient: scope._config['gradient'] || scope._config['defaultGradient']
      });
    });
    store.setCoordinator(coordinator);
  };


  function Heatmap() {
    var config = this._config = Util.merge(HeatmapConfig, arguments[0] || {});
    this._coordinator = new Coordinator();
    if (config['plugin']) {
      var pluginToLoad = config['plugin'];
      if (!HeatmapConfig.plugins[pluginToLoad]) {
        throw new Error('Plugin \''+ pluginToLoad + '\' not found. Maybe it was not registered.');
      } else {
        var plugin = HeatmapConfig.plugins[pluginToLoad];
        // set plugin renderer and store
        this._renderer = new plugin.renderer(config);
        this._store = new plugin.store(config);
      }
    } else {
      this._renderer = new Renderer(config);
      this._store = new Store(config);
    }
    _connect(this);
  };

  // @TODO:
  // add API documentation
  Heatmap.prototype = {
    addData: function() {
      this._store.addData.apply(this._store, arguments);
      return this;
    },
    removeData: function() {
      this._store.removeData && this._store.removeData.apply(this._store, arguments);
      return this;
    },
    setData: function() {
      this._store.setData.apply(this._store, arguments);
      return this;
    },
    setDataMax: function() {
      this._store.setDataMax.apply(this._store, arguments);
      return this;
    },
    setDataMin: function() {
      this._store.setDataMin.apply(this._store, arguments);
      return this;
    },
    configure: function(config) {
      this._config = Util.merge(this._config, config);
      this._renderer.updateConfig(this._config);
      this._coordinator.emit('renderall', this._store._getInternalData());
      return this;
    },
    repaint: function() {
      this._coordinator.emit('renderall', this._store._getInternalData());
      return this;
    },
    getData: function() {
      return this._store.getData();
    },
    getDataURL: function() {
      return this._renderer.getDataURL();
    },
    getValueAt: function(point) {

      if (this._store.getValueAt) {
        return this._store.getValueAt(point);
      } else  if (this._renderer.getValueAt) {
        return this._renderer.getValueAt(point);
      } else {
        return null;
      }
    }
  };

  return Heatmap;

})();


// core
var heatmapFactory = {
  create: function(config) {
    return new Heatmap(config);
  },
  register: function(pluginKey, plugin) {
    HeatmapConfig.plugins[pluginKey] = plugin;
  }
};

global['h337'] = heatmapFactory;

})(this || window);

/**
 * HotSpot.js增加Map事件，判断是否HotSpot显示
 */
EzServerClient.Map.include({
	hotSpotEnable: function(layer) {
		this._hotspotlayer = layer;
		this.on('click',this._onMousemoveOnHotSpot);
	},

	_onMousemoveOnHotSpot:function(e){
		alert("hi");
		this._hotspot = new	EzServerClient.HotSpot();

		var hotspotlayer = this._hotspotlayer,
			areas = hotspotlayer._areas,
			areasString = JSON.stringify(areas);

		if (areasString === '{}') {return;}
		
		var currentColAndRow = this._calCurrentColAndRow(e,hotspotlayer),
			colAndRowArr = [];

		colAndRowArr.push(currentColAndRow['x']['min'] + ":" + currentColAndRow['y']['min']);
		colAndRowArr.push(currentColAndRow['x']['min'] + ":" + currentColAndRow['y']['max']);
		colAndRowArr.push(currentColAndRow['x']['max'] + ":" + currentColAndRow['y']['max']);
		colAndRowArr.push(currentColAndRow['x']['max'] + ":" + currentColAndRow['y']['min']);

		var newareas = [];

		for(var j = 0; j<colAndRowArr.length;j++){
			if (colAndRowArr[j] in areas) {
				if (newareas.length !== 0) {
					newareas.concat(areas[colAndRowArr[j]].slice());
				}
				else{
					newareas = areas[colAndRowArr[j]].slice();
				}
			}
		}

		this.addLayer(EzServerClient.marker(newareas[0].coords));
		this.addLayer(EzServerClient.marker(e.latlng));

		if (this._mouseInarea(e.latlng, newareas)) {
			alert("in!");
		}
	},

	_mouseInarea: function(point,data) {
		var len = data.length,
			zoom = this.getZoom(),
			piexlPoint = this.project(point,zoom)._floor();

		for (var i = 0; i < len; i++) {
			var temppoint = data[i].coords,
				datapoint = this.project(temppoint,zoom)._floor(),
				pointBounds = EzServerClient.bounds(
					EzServerClient.point(datapoint.x - 15, datapoint.y - 15),
					EzServerClient.point(datapoint.x + 15, datapoint.y + 15) );

			if (pointBounds.contains(piexlPoint)) {
				return true;
			}
		}

		return false;
	},

	_calCurrentColAndRow:function(e,hotspotlayer){
		var bounds = this.getPixelBounds(),
			zoom = this.getZoom(),
			tileSize = hotspotlayer._getTileSize();

		if (zoom > hotspotlayer.options.maxZoom || zoom < this.options.minZoom) {return;}

		var tileBounds = EzServerClient.bounds(
		        bounds.min.divideBy(tileSize)._floor(),
		        bounds.max.divideBy(tileSize)._floor());

		var mousePoint = this.project(e.latlng,zoom);

		var boundsTile = {
			'x':{
				'min':0,
				'max':0
			},
			'y':{
				'min':0,
				'max':0
			}
		};

		for (var i = tileBounds.min.x; i <= tileBounds.max.x; i++) {
			var temp = i * tileSize;
			if (temp < mousePoint.x) {
				boundsTile['x']['min'] = i;
			}
			if (temp > mousePoint.x) {
				boundsTile['x']['max'] = i;
				break;
			}
		}

		for (var i = tileBounds.min.y; i <= tileBounds.max.y; i++) {
			var temp = i * tileSize;
			if (temp < mousePoint.y) {
				boundsTile['y']['min'] = i;
			}
			if (temp > mousePoint.y) {
				boundsTile['y']['max'] = i;
				break;
			}
		}

		return boundsTile;
	}
});


/**
 * EzServerClient.HotSpot类定义HotSpot样式等
 */
EzServerClient.HotSpot = EzServerClient.Class.extend({

});

/**
 * HotSpot.js 基于GeoJSON数据格式的HotSpot解决方案
 */
EzServerClient.HotSpot = EzServerClient.Class.extend({
	initialize: function() {
		
	}
});

/*
	Leaflet.contextmenu, A context menu for Leaflet.
	(c) 2014, Adam Ratcliffe, TomTom International BV
*/
EzServerClient.Map.mergeOptions({
	contextmenuItems: []
});

EzServerClient.Map.ContextMenu = EzServerClient.Handler.extend({

	statics: {
		BASE_CLS: 'leaflet-contextmenu'
	},

	initialize: function (map) {
		EzServerClient.Handler.prototype.initialize.call(this, map);

		this._items = [];
		this._visible = false;

		var container = this._container = EzServerClient.DomUtil.create('div', EzServerClient.Map.ContextMenu.BASE_CLS, map._container);
		container.style.zIndex = 10000;
		container.style.position = 'absolute';

		if (map.options.contextmenuWidth) {
			container.style.width = map.options.contextmenuWidth + 'px';
		}
		
		this._createItems();

		EzServerClient.DomEvent
			.on(container, 'click', EzServerClient.DomEvent.stop)
			.on(container, 'mousedown', EzServerClient.DomEvent.stop)
			.on(container, 'dblclick', EzServerClient.DomEvent.stop)
			.on(container, 'contextmenu', EzServerClient.DomEvent.stop);
	},

	addHooks: function () {
		EzServerClient.DomEvent
		    .on(document, (EzServerClient.Browser.touch ? 'touchstart' : 'mousedown'), this._onMouseDown, this)
			.on(document, 'keydown', this._onKeyDown, this);

		this._map.on({
			contextmenu: this._show,
			mouseout: this._hide,
			mousedown: this._hide,
			movestart: this._hide,
			zoomstart: this._hide
		}, this);
	},

	removeHooks: function () {
		EzServerClient.DomEvent.off(document, 'keydown', this._onKeyDown, this);

		this._map.off({
			contextmenu: this._show,
			mouseout: this._hide,
			mousedown: this._hide,
			movestart: this._hide,
			zoomstart: this._hide
		}, this);
	},

	showAt: function (point, data) {
		if (point instanceof EzServerClient.LatLng) {
			point = this._map.latLngToContainerPoint(point);
		}
		this._showAtPoint(point, data);
	},

	hide: function () {
		this._hide();
	},

	addItem: function (options) {
		return this.insertItem(options);
	},

	insertItem: function (options, index) {
		index = index !== undefined ? index: this._items.length; 

		var item = this._createItem(this._container, options, index);
		
		this._items.push(item);

		this._sizeChanged = true;

		this._map.fire('contextmenu.additem', {
			contextmenu: this,
			el: item.el,
			index: index
		});

		return item.el;
	},

	removeItem: function (item) {
		var container = this._container;

		if (!isNaN(item)) {
			item = container.children[item];
		}

		if (item) {
			this._removeItem(EzServerClient.Util.stamp(item));

			this._sizeChanged = true;

			this._map.fire('contextmenu.removeitem', {
				contextmenu: this,
				el: item
			});
		}		
	},

	removeAllItems: function () {
		var item;

		while (this._container.children.length) {
			item = this._container.children[0];
			this._removeItem(EzServerClient.Util.stamp(item));
		}
	},

	hideAllItems: function () {
		var item, i, l;

		for (i = 0, l = this._items.length; i < l; i++) {
			item = this._items[i];
			item.el.style.display = 'none';
		}
	},

	showAllItems: function () {
		var item, i, l;

		for (i = 0, l = this._items.length; i < l; i++) {
			item = this._items[i];
			item.el.style.display = '';
		}		
	},

	setDisabled: function (item, disabled) {
		var container = this._container,
		itemCls = EzServerClient.Map.ContextMenu.BASE_CLS + '-item';

		if (!isNaN(item)) {
			item = container.children[item];
		}

		if (item && EzServerClient.DomUtil.hasClass(item, itemCls)) {
			if (disabled) {
				EzServerClient.DomUtil.addClass(item, itemCls + '-disabled');
				this._map.fire('contextmenu.disableitem', {
					contextmenu: this,
					el: item
				});
			} else {
				EzServerClient.DomUtil.removeClass(item, itemCls + '-disabled');
				this._map.fire('contextmenu.enableitem', {
					contextmenu: this,
					el: item
				});
			}			
		}
	},

	isVisible: function () {
		return this._visible;
	},

	_createItems: function () {
		var itemOptions = this._map.options.contextmenuItems,
		    item,
		    i, l;

		for (i = 0, l = itemOptions.length; i < l; i++) {
			this._items.push(this._createItem(this._container, itemOptions[i]));
		}
	},

	_createItem: function (container, options, index) {
		if (options.separator || options === '-') {
			return this._createSeparator(container, index);
		}

		var itemCls = EzServerClient.Map.ContextMenu.BASE_CLS + '-item', 
		    cls = options.disabled ? (itemCls + ' ' + itemCls + '-disabled') : itemCls,
		    el = this._insertElementAt('a', cls, container, index),
		    callback = this._createEventHandler(el, options.callback, options.context, options.hideOnSelect),
		    html = '';
		
		if (options.icon) {
			html = '<img class="' + EzServerClient.Map.ContextMenu.BASE_CLS + '-icon" src="' + options.icon + '"/>';
		} else if (options.iconCls) {
			html = '<span class="' + EzServerClient.Map.ContextMenu.BASE_CLS + '-icon ' + options.iconCls + '"></span>';
		}

		el.innerHTML = html + options.text;		
		el.href = '#';

		EzServerClient.DomEvent
			.on(el, 'mouseover', this._onItemMouseOver, this)
			.on(el, 'mouseout', this._onItemMouseOut, this)
			.on(el, 'mousedown', EzServerClient.DomEvent.stopPropagation)
			.on(el, 'click', callback);

		return {
			id: EzServerClient.Util.stamp(el),
			el: el,
			callback: callback
		};
	},

	_removeItem: function (id) {
		var item,
		    el,
		    i, l;

		for (i = 0, l = this._items.length; i < l; i++) {
			item = this._items[i];

			if (item.id === id) {
				el = item.el;
				callback = item.callback;

				if (callback) {
					EzServerClient.DomEvent
						.off(el, 'mouseover', this._onItemMouseOver, this)
						.off(el, 'mouseover', this._onItemMouseOut, this)
						.off(el, 'mousedown', EzServerClient.DomEvent.stopPropagation)
						.off(el, 'click', item.callback);				
				}
				
				this._container.removeChild(el);
				this._items.splice(i, 1);

				return item;
			}
		}
		return null;
	},

	_createSeparator: function (container, index) {
		var el = this._insertElementAt('div', EzServerClient.Map.ContextMenu.BASE_CLS + '-separator', container, index);
		
		return {
			id: EzServerClient.Util.stamp(el),
			el: el
		};
	},

	_createEventHandler: function (el, func, context, hideOnSelect) {
		var me = this,
		    map = this._map,
		    disabledCls = EzServerClient.Map.ContextMenu.BASE_CLS + '-item-disabled',
		    hideOnSelect = (hideOnSelect !== undefined) ? hideOnSelect : true;
		
		return function (e) {
			if (EzServerClient.DomUtil.hasClass(el, disabledCls)) {
				return;
			}
			
			if (hideOnSelect) {
				me._hide();			
			}

			if (func) {
				func.call(context || map, me._showLocation);			
			}

			me._map.fire('contextmenu:select', {
				contextmenu: me,
				el: el
			});
		};
	},

	_insertElementAt: function (tagName, className, container, index) {
		var refEl,
		    el = document.createElement(tagName);

		el.className = className;

		if (index !== undefined) {
			refEl = container.children[index];
		}

		if (refEl) {
			container.insertBefore(el, refEl);
		} else {
			container.appendChild(el);
		}

		return el;
	},

	_show: function (e) {
		this._showAtPoint(e.containerPoint);
	},

	_showAtPoint: function (pt, data) {
		if (this._items.length) {
			var map = this._map,
			layerPoint = map.containerPointToLayerPoint(pt),
			latlng = map.layerPointToLatLng(layerPoint),
			event = {contextmenu: this};
			
			if (data) {
				event = EzServerClient.extend(data, event);
			}
			
			this._showLocation = {
				latlng: latlng,
				layerPoint: layerPoint,
				containerPoint: pt
			};

			this._setPosition(pt);			

			if (!this._visible) {
				this._container.style.display = 'block';							
				this._visible = true;							
			} else {
				this._setPosition(pt);			
			}

			this._map.fire('contextmenu.show', event);
		}
	},

	_hide: function () {
		if (this._visible) {
			this._visible = false;
			this._container.style.display = 'none';
			this._map.fire('contextmenu.hide', {contextmenu: this});
		}
	},

	_setPosition: function (pt) {
		var mapSize = this._map.getSize(),
		    container = this._container,
		    containerSize = this._getElementSize(container),
		    anchor;

		if (this._map.options.contextmenuAnchor) {
			anchor = EzServerClient.point(this._map.options.contextmenuAnchor);
			pt = pt.add(anchor);
		}

		container._leaflet_pos = pt;

		if (pt.x + containerSize.x > mapSize.x) {
			container.style.left = 'auto';
			container.style.right = Math.max(mapSize.x - pt.x, 0) + 'px';
		} else {
			container.style.left = Math.max(pt.x, 0) + 'px';
			container.style.right = 'auto';
		}
		
		if (pt.y + containerSize.y > mapSize.y) {
			container.style.top = 'auto';
			container.style.bottom = Math.max(mapSize.y - pt.y, 0) + 'px';
		} else {
			container.style.top = Math.max(pt.y, 0) + 'px';
			container.style.bottom = 'auto';
		}
	},

	_getElementSize: function (el) {		
		var size = this._size,
		    initialDisplay = el.style.display;

		if (!size || this._sizeChanged) {
			size = {};

			el.style.left = '-999999px';
			el.style.right = 'auto';
			el.style.display = 'block';
			
			size.x = el.offsetWidth;
			size.y = el.offsetHeight;
			
			el.style.left = 'auto';
			el.style.display = initialDisplay;
			
			this._sizeChanged = false;
		}

		return size;
	},

	_onMouseDown: function (e) {
		this._hide();
	},

	_onKeyDown: function (e) {
		var key = e.keyCode;

		// If ESC pressed and context menu is visible hide it 
		if (key === 27) {
			this._hide();
		}
	},

	_onItemMouseOver: function (e) {
		EzServerClient.DomUtil.addClass(e.target || e.srcElement, 'over');
	},

	_onItemMouseOut: function (e) {
		EzServerClient.DomUtil.removeClass(e.target || e.srcElement, 'over');
	}
});

EzServerClient.Map.addInitHook('addHandler', 'contextmenu', EzServerClient.Map.ContextMenu);
EzServerClient.Mixin.ContextMenu = {

	_initContextMenu: function () {
		this._items = [];
	
		this.on('contextmenu', this._showContextMenu, this);
	},

	_showContextMenu: function (e) {
		var itemOptions,
		    pt, i, l;

		if (this._map.contextmenu) {
			pt = this._map.mouseEventToContainerPoint(e.originalEvent);

			if (!this.options.contextmenuInheritItems) {
				this._map.contextmenu.hideAllItems();
			}

			for (i = 0, l = this.options.contextmenuItems.length; i < l; i++) {
				itemOptions = this.options.contextmenuItems[i];
				this._items.push(this._map.contextmenu.insertItem(itemOptions, itemOptions.index));
			}

			this._map.once('contextmenu.hide', this._hideContextMenu, this);
		
			this._map.contextmenu.showAt(pt, {relatedTarget: this});
		}
	},

	_hideContextMenu: function () {
		var i, l;

		for (i = 0, l = this._items.length; i < l; i++) {
			this._map.contextmenu.removeItem(this._items[i]);
		}
		this._items.length = 0;		

		if (!this.options.contextmenuInheritItems) {
			this._map.contextmenu.showAllItems();
		}
	}	
};

var classes = [EzServerClient.Marker, EzServerClient.Path, EzServerClient.GeoJSON],
    defaultOptions = {
		contextmenu: false,
		contextmenuItems: [],
	    contextmenuInheritItems: true
	},
    cls, i, l;

for (i = 0, l = classes.length; i < l; i++) {
	cls = classes[i];

	// EzServerClient.Class should probably provide an empty options hash, as it does not test
	// for it here and add if needed
	if (!cls.prototype.options) {
		cls.prototype.options = defaultOptions;
	} else {
		cls.mergeOptions(defaultOptions);
	}

	cls.addInitHook(function () {
		if (this.options.contextmenu) {
			this._initContextMenu();
		}
	});

	cls.include(EzServerClient.Mixin.ContextMenu);
}


/**
 * Created by Administrator on 2014/7/22.
 */
EzServerClient.Ajax = EzServerClient.Class.extend({
    get: function (vUrl, vCallback, errorFunc) {
        var oXmlHttp = window.ActiveXObject ? new ActiveXObject("Microsoft.XMLHTTP") : new XMLHttpRequest();
        oXmlHttp.onreadystatechange = function () {
            if (oXmlHttp.readyState == 4) {
                if (oXmlHttp.status == 200 || oXmlHttp.status == 304) {
                    vCallback(oXmlHttp.responseText);
                } else {
                    errorFunc();
                }
            }
        }
        oXmlHttp.open('GET', vUrl, true);
        oXmlHttp.send(null)
    }
})

/*
	EzServerClient GPS Monitoring View Control
 */

EzServerClient.GPSView = EzServerClient.Circle.extend({

	includes: EzServerClient.Mixin.Events,

	options:{
		radius: 20,
		weight: 2
	},

	initialize: function(options) {
		EzServerClient.setOptions(this, options);
		this._data = 0;
		this._radius = this.options.radius;
		this._counter = 0;
	},

	onAdd: function(map) {
		this._map = map;

		if (!this._container) {
			this._initElements();
			this._initEvents();
		}

		if (this._container) {
			this._map._pathRoot.appendChild(this._container);
		}

		this.fire('add');
		
		this.movingAndzooming = false;
		
		map.on({
			'viewreset': this.projectLatlngs,
			'moveend': this.projectLatlngs,
			'movestart': this.setParam,
			'zoomstart':this.setParam,
			'contextmenu':this._onContextMenu
		}, this);
	},

	setParam:function() {
		this.movingAndzooming = true;
	},
	
	projectLatlngs: function () {
		var GPSCarJudge = null;
		if (this._boundsBoolAndCal()) {
			var bufData = this.gpsCtrlPtr.getGpsInfoArrayOnCurrentView(this.bufferBounds);
			for (var i = 0; i < bufData.length; i++) {
				var bufLatLng = EzServerClient.latLng([bufData[i]['y'],bufData[i]['x']]);
				if (this.windowBounds.contains(bufLatLng)) {
					bufData[i]['windowBounds'] = true;
				}
				else{
					bufData[i]['windowBounds'] = false;
				}
			}
			GPSCarJudge = bufData;
		}
		
		//GPS car 
		this._datalayerModel = this._dataConvertMapCoord(GPSCarJudge);
		GPSCarJudge = null;
		
		//Timer 控制数据更新
		if (this._map.getZoom() > 16){
			if (!this.timer) {
				this.timer = window.setInterval(this.updateWindowBoundData.bind(this), 500);
			}			
		}
		else{
			this.timer = window.clearInterval(this.timer);
		}
		
		//GPS History track
		if (this._historydata) {
			var dataHistoryArray = this._historydata,
				dataHistoryModel = {},
				layerHisData = new Array();

			for (var i = 0; i < dataHistoryArray.length; i++) {
				for (var j in dataHistoryArray[i]) {
					if (dataHistoryArray[i].hasOwnProperty(j)) {
						dataHistoryModel[j] = dataHistoryArray[i][j];
					}
				}
				var coord = dataHistoryModel['latLng'] = EzServerClient.latLng(dataHistoryModel['Lat'], dataHistoryModel['Lon']);
				dataHistoryModel['layerPoint'] = this._map.latLngToLayerPoint(coord);
				layerHisData.push(dataHistoryModel);
				dataHistoryModel = {};
			}

			this._dataHisLayerModel = layerHisData;
			this.historyTracking = false;
		}
		this._updatePath();
		this.movingAndzooming = false;
	},
	
	 _dataConvertMapCoord:function(GPSCarJudge){
		 if (GPSCarJudge != null){
				var dataArr = GPSCarJudge,
					dataModel = {},
					bufferLayerData = new Array();
				
				for (var i = 0; i < dataArr.length; i++) {
					for (var j in dataArr[i]) {
						if (dataArr[i].hasOwnProperty(j)) {
							dataModel[j] = dataArr[i][j];
						}
					}
					var coord = dataModel['latLng'] = EzServerClient.latLng(dataModel['y'], dataModel['x']);
					dataModel['layerPoint'] = this._map.latLngToLayerPoint(coord);
					bufferLayerData.push(dataModel);
					dataModel = {};
				}
				return bufferLayerData;
			}
	 },
	 
	_updatePath: function() {
		//暂时没有实现下面检测方法，查看数据是否在边界内
		//if (this._checkIfEmpty()) { return; }	

		var ctx = this._ctx,
		    options = this.options,
			gpsControl = this.gpsCtrlPtr;
	
		gpsControl.setGpsInfoArrayOnCurrentView(this._datalayerModel);
		// this._render();
		if (this._dataHisLayerModel) {
			gpsControl.setGpsTrack(this._dataHisLayerModel);
		}
	},
	
	updateWindowBoundData:function() {
		var coord = this.windowBounds.toBBoxString(),	
			result = GPSInfo.updateGpsInfoByWindowBounds(coord);
		
		if (result != null){
			for (var i = 0; i < this._datalayerModel.length; i++) {
				if (this._datalayerModel[i]['windowBounds']){
					var id = this._datalayerModel[i]['GpsID'];
					for (var j = 0; j < result.length; j++) {
						if (id == result[j]['id']){
							this._datalayerModel[i]['dir'] = result[j]['dir'];
							this._datalayerModel[i]['Speed'] = result[j]['speed'];
							this._datalayerModel[i]['x'] = result[j]['x'];
							this._datalayerModel[i]['y'] = result[j]['y'];
							break;
						}
					}
				}
			}
		}
		if(!this.movingAndzooming){
			this._updatePath();
		}	
	},

	showLabel: function(e) {
		var dataTarget = this._containsPoint(e.layerPoint);
		if (this._label == undefined) {
			this._label = new EzServerClient.Label();
		}
		
		if (dataTarget) {
			var showString = "CallNo: " + dataTarget['CallNo'] + "<br/>" + "CarType: " + dataTarget['CarType'] + "<br/>" + "GpsID: " + dataTarget['GpsID'] + "<br/>" + "Org: " + dataTarget['Org'] + "<br/>" + "Speed: " + dataTarget['Speed'] + "<br/>" + "Status: " + dataTarget['Status'] + "<br/>" + "dir: " + dataTarget['dir'] + "<br/>" + "position: " + dataTarget['latLng'].lng+","+dataTarget['latLng'].lat;
			this._label.setContent(showString);
			this._label.setLatLng(e.latlng);
			this._map.showLabel(this._label);
		}
	},

	closeLabel: function() {
		this._label.close();
	},

	_checkIfEmpty: function() {
		if (!this._map) {
			return false;
		}
		var vp = this._map._pathViewport,
		    r = this._radius,
		    p = this._point;

		return p.x - r > vp.max.x || p.y - r > vp.max.y ||
		       p.x + r < vp.min.x || p.y + r < vp.min.y;
	},

	_updateStyle: function() {
		var options = this.options;

		if (options.stroke) {
			this._ctx.lineWidth = options.weight;
			this._ctx.strokeStyle = options.color;
		}
		if (options.fill) {
			this._ctx.fillStyle = options.fillColor || options.color;
		}
	},

	_initElements: function() {
		this._map._initGPSPathRoot();
		this._ctx = this._map._canvasCtx;
	},

	_initEvents: function() {
		if (this.options.clickable) {
			// TODO dblclick
			this._map.on('mousemove', this._onMouseMove, this);
			this._map.on('click', this._onClick, this);
		}
	},

	_onMouseMove: function (e) {
		if (!this._map || this._map._animatingZoom) { return; }

		// TODO don't do on each move
		if (this._containsPoint(e.layerPoint)) {
			this._ctx.canvas.style.cursor = 'pointer';
			this._mouseInside = true;
			this.fire('mouseover', e);

		} else if (this._mouseInside) {
			this._ctx.canvas.style.cursor = '';
			this._mouseInside = false;
			this.fire('mouseout', e);
		}
	},
	

	_onContextMenu : function(e) {
		
	},

	_containsPoint: function(p) {
		var dataArr = this._datalayerModel,
		    w2 = this.options.stroke ? this.options.weight / 2 : 0;
		
		if (!dataArr) {
			return;
		}
		
		for (var i = 0; i < dataArr.length; i++) {
			var center = dataArr[i].layerPoint;
			if (p.distanceTo(center) <= this._radius + w2) {
				return dataArr[i];
			}
		}
	},

	/**
	 * @description: 计算目前窗口地理Bounds、数据存储地理Bounds，同时判断存储地理Bouns与展示存储地理Boouns的包含关系
	 * @param: null
	 * @return: bool
	 */
	_boundsBoolAndCal : function() {
		if (!this.gpsCtrlPtr.demoStorageBounds) {
			return;
		}
		var currentCenter = this._map.getCenter(),
			currentZoom = this._map.getZoom(),
			currentBounds = this._map.getBounds(),
			currentWest = currentBounds.getWest(),
			currentEast = currentBounds.getEast(),
			currentNorth = currentBounds.getNorth(),
			currentSouth = currentBounds.getSouth();
		var newWest = currentWest - (currentEast - currentWest) / 2, 
			newEast = currentEast + (currentEast - currentWest) / 2, 
			newSouth = currentSouth - (currentNorth - currentSouth) / 2, 
			newNorth = currentNorth + (currentNorth - currentSouth) / 2;
		var bufBounds = EzServerClient.latLngBounds(EzServerClient.latLng([newSouth,newWest]),EzServerClient.latLng([newNorth,newEast]));
		if (this._boundsContains(bufBounds,this.gpsCtrlPtr.demoStorageBounds)) {
			return false;
		}
		if(this._boundsContains(this.gpsCtrlPtr.demoStorageBounds,bufBounds)){
			this.windowBounds = currentBounds;
			this.bufferBounds = bufBounds;
			return true;
		}
		else{
			this.gpsCtrlPtr.defineDemoStorageBounds(bufBounds.getCenter());
			this.windowBounds = currentBounds;
			this.bufferBounds = bufBounds;
			return true;
		}
	},
	
	/**
	 * @description: 补充地理Bounds包含关系判断
	 * @param: bounds1,bounds2
	 * @return: bool
	 */
	_boundsContains : function(bounds1, bounds2) {
		var sw1 = bounds1.getSouthWest(),
			ne1 = bounds1.getNorthEast();
		var sw2 = bounds2.getSouthWest(),
			ne2 = bounds2.getNorthEast();
		if ((sw1.lat <= sw2.lat) && (ne1.lat >= ne2.lat) && (sw1.lng <= sw2.lng) && (ne1.lng >= ne2.lng)) {
			return true;
		}
		return false;
	},

	/**
	 * @description: 存储历史轨迹线数据，并把它绘制到地图上
	 * @param: data-->json
	 * @return: null
	 */
	setHistoryTrack: function(data) {
		this.historyTracking = true;
		this._historydata = data;
		this.projectLatlngs();
		this._updatePath();
	},

	addTo: function (map) {
		map.addLayer(this);
		return this;
	},
	

	_initContextMenu : function() {
		
	},

	/**
	 * @description: 创建GPSCtrlPtr对象
	 * @param: null
	 * @return: GPSCtrlPtr
	 */
	createGPSCtrlPtrObject: function() {
		var gpsCtrl = this.gpsCtrlPtr = new GPSCtrlPtr(this);
		return gpsCtrl;
	}
});

EzServerClient.Map.include({
	_initGPSPathRoot: function() {
		var root = this._pathRoot,
		    ctx;

		if (!root) {
			root = this._pathRoot = document.createElement('canvas');
			root.style.position = 'absolute';
			ctx = this._canvasCtx = root.getContext('2d');

			ctx.lineCap = 'round';
			ctx.lineJoin = 'round';

			this._panes.overlayPane.appendChild(root);

			if (this.options.zoomAnimation) {
				this._pathRoot.className = 'leaflet-zoom-animated';
				this.on('zoomanim', this._animatePathZoom);
				this.on('zoomend', this._endPathZoom);
			}
			this.on('moveend', this._updateCanvasViewport);
			this._updateCanvasViewport();
		}
	},

	_updateCanvasViewport: function() {
		if (this._pathZooming) {
			return;
		}
		this._updatePathViewport();

		var vp = this._pathViewport,
			min = vp.min,
			size = vp.max.subtract(min),
			root = this._pathRoot;

		//TODO check if this works properly on mobile webkit
		EzServerClient.DomUtil.setPosition(root, min);
		root.width = size.x;
		root.height = size.y;
		root.getContext('2d').translate(-min.x, -min.y);
	}
});

/*
	GPSControl usage of "draw the GPS car in Canvas"
 */

var GPSCtrlPtr = EzServerClient.Class.extend({
	options: {
		MonitorRegion: false
	},

	initialize: function(GpsView) {
		this._ctx = GpsView._ctx;
		this.GpsView = GpsView;
		this.map = GpsView._map;
		this._radius = 20;
	},
	
	/**
	 * @description: 查询全局设备信息
	 * @param: null-->待确定
	 * @return: list
	 */
	getGpsInfo : function() {
		var that = this;
		(function(){
			$.ajax({
				url : 'http://172.18.69.54:8080/ProxyProject1/ServletProxy',
				type : 'POST',
				async : true,
				data : {
					url : "http://172.18.69.194:8080/gpsServer/OrgManagerServlet",
					method : "_getGpsInfo",
					gpsJson : JSON.stringify({
						"carno" : "11"
					})
				},
				dataType : 'json',
				success : function(json) {
					that.deviceInfoArr = json;
					//把数组信息转化为GpsInfo数组
					that._gpsArrayInfoToGpsInfoArray();
				},
				error : function() {
					console.log("连接失败!");
				}
			});
		})(that);
	},
	/**
	 * @description: 根据坐标范围返回GPS设备信息
	 * @param: string-->x1,y1,x2,y2-->经度,纬度,经度,纬度
	 * @return: 返回Array存储在GPSCtrPtr对象属性deviceInfoArr中
	 */
	getDeviceInfoByRect : function(coordStr) {
		var that = this;
		(function(){
			$.ajax({
				url : 'http://172.18.69.54:8080/ProxyProject1/ServletProxy',
				type : 'POST',
				async : false,
				data : {
					url : "http://172.18.69.194:8080/gpsServer/LbsManagerServlet",
					method : "getLocationByRectForMDM",
					appKey : "admin",
					geo : JSON.stringify({
						"type" : "rect",
						"shape" : coordStr
					})
				},
				dataType : 'json',
				success : function(json) {
					that.deviceInfoArr = json.result;
				},
				error : function() {
					console.log("连接失败!");
				}
			});
		})(that)
	},
	
	/**
	 * @description: 根据gpsId获取历史轨迹线XML数据
	 * @param: fromDate,toDate,gpsID-->string,string,string
	 * @return: null-->
	 */
	getGpsTrackById : function(fromTime,toTime,id) {
		var that = this;
		(function(){
			$.ajax({
				url : 'http://172.18.69.54:8080/ProxyProject1/ServletProxy',
				type : 'POST',
				async : false,
				data : {
					url : "http://172.18.69.194:8080/gpsServer/monitorServlet",
					fromtime : fromTime,
					totime : toTime,
					gpsid : id
				},
				dataType : 'xml',
				success : function(data) {
					var trackPoints = new Array();
					$(data).find("MobilePos").each(function(i) {
						var lon = $(this).attr("Lon"),
							lat = $(this).attr("Lat"),
							time = $(this).attr("Time");
						var trackPoint = {};
						trackPoint.Lon = lon;
						trackPoint.Lat = lat;
						trackPoint.Time = time;
						trackPoints.push(trackPoint);
					});
					that._trackLineManage(id,trackPoints);
				},
				error : function() {
					console.log("连接失败!");
				}
			});
		})(that,id)
	},
	
	/**
	 * @description: 历史轨迹线数据管理<Private>
	 * @param: gpsID,gpsPoints-->string Array
	 * @return: null
	 */
	_trackLineManage : function(id, dataArr) {
		if (!this.trackLineManage){
			this.trackLineManage = new Array();
		}
		
		if (id && dataArr.length!=0){
			var trackLine = {};
			trackLine.gpsID = id;
			trackLine.point = dataArr;
			this.trackLineManage.push(trackLine);
		}
	},
	
	/**
	 * @description: gps信息数组到GPSInfo对象数组的转换<Private>
	 * @param: null
	 * @return: null-->对象集成到GPSCtrlPtr属性
	 */
	_gpsArrayInfoToGpsInfoArray : function() {
		this.GpsInfoArray = new Array();
		var InfoArray = this.deviceInfoArr;
		
		for (var i = 0; i < InfoArray.length; i++) {
			var tempGpsInfo = new GPSInfo();
			tempGpsInfo.GpsID = (InfoArray[i].gpsId != undefined) ? InfoArray[i].gpsId: '-1';
			tempGpsInfo.dir = (InfoArray[i].dir != undefined) ? InfoArray[i].dir: 0;
			tempGpsInfo.Speed = (InfoArray[i].speed != undefined) ? InfoArray[i].speed: 0;
			tempGpsInfo.x = (InfoArray[i].x != undefined) ? InfoArray[i].x: 0;
			tempGpsInfo.y = (InfoArray[i].y != undefined) ? InfoArray[i].y: 0;
			tempGpsInfo.CallNo = (InfoArray[i].callno != undefined) ? InfoArray[i].callno: '-1';
			tempGpsInfo.CarType = (InfoArray[i].pictureType != undefined) ? InfoArray[i].pictureType: '-1';
			tempGpsInfo.Org = (InfoArray[i].orgId != undefined) ? InfoArray[i].orgId: '-1';
			tempGpsInfo.Status = (InfoArray[i].status != undefined) ? InfoArray[i].status: 0;
			this.GpsInfoArray.push(tempGpsInfo);
		}
		
		this.deviceInfoArr = undefined;
		
		var currentCenter = this.map.getCenter(),
			currentZoom = this.map.getZoom();
		
		this.map.setView(currentCenter, 10);
		this.demoStorageData = this.getGpsInfoArrayOnCurrentView();
		this.demoStorageBounds = this.map.getBounds();
		this.map.setView(currentCenter,currentZoom);
	},
	
	defineDemoStorageBounds:function(center){
		if (this.demoStorageBounds){
			var west = this.demoStorageBounds.getWest(),
				east = this.demoStorageBounds.getEast(),
				south = this.demoStorageBounds.getSouth(),
				north = this.demoStorageBounds.getNorth();
			var halfWA = (east - west) / 2,
				halfSN = (north - south) / 2;
			var sw = EzServerClient.latLng([(center.lat - halfSN),(center.lng - halfWA)]),
				ne = EzServerClient.latLng([(center.lat + halfSN),(center.lng + halfWA)]);
			this.demoStorageBounds = EzServerClient.latLngBounds(sw,ne);
			this.demoStorageData = this.getGpsInfoArrayOnCurrentView(this.demoStorageBounds);
		}
	},
	
	/**
	 * @description: 获取当前窗口下GPSInfo对象，构建GPSInfo对象数组传回
	 * @param: null
	 * @return: GPSInfo[]
	 */
	getGpsInfoArrayOnCurrentView : function(bounds) {
		var currentGpsInfoArray = new Array(), 
			tempArr = this.GpsInfoArray;
		
		if (!bounds) {
			bounds = this._getCurrentViewBounds();
		}

		if (!tempArr) {
			return;
		}

		for (var i = 0; i < tempArr.length; i++) {
			if (bounds.contains(tempArr[i].getLatlngOfGPSInfo())) {
				currentGpsInfoArray.push(tempArr[i]);
			}
		}
		return currentGpsInfoArray;
	},
	
	/**
	 * @description: 获得目前的窗口视图边界<Private>
	 * @param: null
	 * @return: EzServerClient.Map
	 */
	_getCurrentViewBounds : function() {
		if (!this.options.MonitorRegion) {
			return this.map.getBounds();
		} else {
			return this._monitorRegion.Region;
		}
	},

	/**
	 * @description: 根据矩形区域获取GPSInfo数据
	 * @param: EzServerClient.LatLngBounds
	 * @return: GpsInfo[]
	 */
	getGpsInfoByBounds: function(bounds) {
		var currentGpsInfoArray = new Array(), 
			tempArr = this.GpsInfoArray;

		if (!tempArr) {
			return;
		}

		for (var i = 0; i < tempArr.length; i++) {
			if (bounds.contains(tempArr[i].getLatlngOfGPSInfo())) {
				currentGpsInfoArray.push(tempArr[i]);
			}
		}
		return currentGpsInfoArray;
	},

	/**
	 * @description: 通过GPSId获取GPSInfo对象
	 * @param: id-->string
	 * @return: GPSInfo
	 */
	getGpsInfoByGpsId:function(){
		var tempArr = this.GpsInfoArray;
		for (var i = 0; i < tempArr.length; i++) {
			if (id===tempArr[i].GpsID) {
				return tempArr[i];
			}
		}
	},
	
	/**
	 * @description: 把<目前窗口视图>下GpsInfo对象数组展示到Canvas画布上
	 * @param: array[]
	 * @return: null
	 */
	setGpsInfoArrayOnCurrentView : function(layerArr) {
		if (!layerArr) {
			return;
		}
		var data = layerArr,
			context = this._ctx,
			img = this._setGpsCarIcon("EzTest/014.png"),
			searchRadius = Math.round((img.width + img.height) / 4),
			rotate = Math.PI / 180;
		
		for (var i = 0; i < data.length; i++) {
			context.save();
			var point = data[i]['layerPoint'],
				angleInRadius = data[i]['dir'] * rotate,
				speed = data[i]['Speed'],
				status = data[i]['Status'];
			context.translate(point.x, point.y);
			context.rotate(angleInRadius);
			context.shadowOffsetX = 2.5;
			context.shadowOffsetY = 2.5;
			context.shadowBlur = 40;
			context.shadowColor = "#9D9D9D";
			context.drawImage(img, -searchRadius, -searchRadius);

			context.restore();
		}
	},

	render: function() {
		var context = this._ctx;

		console.log(new Date());
	},

	/**
	 * @description: 绘制动态轨迹线
	 * @param: array[]
	 * @return: null
	 */
	_setGpsTrackLine: function(data) {
		if (!data) {
			return;
		}

		var context = this._ctx;

		for (var i = 0; i < data.length; i++) {
			var point = data[i]['layerPoint'];

			context.save();
			context.translate(point.x, point.y);
			if (i == 0) {
				context.beginPath();
				context.moveTo(0, 0);
			} else {
				context.lineTo(0, 0);
			}
			context.restore();
		}
		//context.closePath();
		context.strokeStyle = "#000000";
		context.lineWidth = 3;
		context.globalAlpha = 0.8;
		context.stroke();
	},

	/**
	 * @description: 绘制动态轨迹移动三角
	 * @param: array[]
	 * @return: null
	 */
	_setGpsTrackDanamicTriangle: function(data) {
		if (!data) {
			return;
		}

		var context = this._ctx;

		for (var i = 0; i < data.length - 1; i++) {
			var point = data[i]['layerPoint'],
				point2 = data[i + 1]['layerPoint'],
				distance = this._calculateDistance(point, point2);

			var xdiff = point2.x - point.x,
				ydiff = point2.y - point.y,
				angle = Math.atan(ydiff / xdiff);

			if (distance < 20) {
				return;
			}

			var n = Math.floor(distance / 20) +1,
				diff = 20,
				count = 1;

			context.save();
			context.translate(point.x, point.y);
			context.rotate(angle);

			while (count < n) {
				var offset = count * diff;
				context.moveTo(offset, 0);
				this._drawTriangle(offset);
				count++;
			}
			context.restore();
		}
	},

	_drawTriangle: function(offset) {
		var context = this._ctx;

		context.beginPath();
		context.lineTo(offset,-6);
		context.lineTo(offset+Math.sqrt(80),0);
		context.lineTo(offset,6);
		context.closePath();

		context.fillStyle = "#000000";
		context.globalAlpha = 0.8;
		context.fill();
	},

	_calculateDistance: function(point, point2) {
		var xSquare = (point2.x - point.x) * (point2.x - point.x),
			ySquare = (point2.y - point.y) * (point2.y - point.y);
		return Math.sqrt(xSquare + ySquare);
	},

	/**
	 * @description: 绘制Gps轨迹点及其样式
	 * @param: array[]
	 * @return: null
	 */
	_setGpsTrackPoint: function(data) {
		if (!data) {
			return;
		}

		var context = this._ctx;

		for (var i = 0; i < data.length; i++) {
			context.save();
			var point = data[i]['layerPoint'];
			context.translate(point.x, point.y);
			context.moveTo(0,0);
			context.strokeStyle = "#000000";
			context.fillStyle = "#000000";
			context.globalAlpha = 0.5;
			context.beginPath();
			context.arc(0, 0, 10, 0, 2 * Math.PI, false);
			context.closePath();
			context.fill();
			context.globalAlpha = 0.8
			context.beginPath();
			context.arc(0, 0, 12, 0, 2 * Math.PI, false);
			context.closePath();
			context.stroke();
			context.restore();
		}
	},

	/**
	 * @description: 在<目前窗口视图>下Gps轨迹线展示到Canvas画布上
	 * @param: array[]
	 * @return: null
	 */
	setGpsTrack: function(layerHisArr) {
		if (!layerHisArr) {
			return;
		}
		var data = layerHisArr;

		this._setGpsTrackPoint(data);
		this._setGpsTrackLine(data);
		this._setGpsTrackDanamicTriangle(data);
	},

	_setGpsCarIcon: function(srcString) {
		var img = new Image();
		img.src = srcString;
		return img;
	},

	/**
	 * @description: 通过该方法获取PointStyle对象，从而设置其绘制的样式信息
	 * @param: null
	 * @return: PointStyle
	 */
	getPointStyleObject : function() {
		return new PointStyle(this._ctx);
	},

	/**
	 * @description: 增加一个裁减矩形区, 只有处于该区域内的车辆可见
	 * @param: 对角线坐标，坐标模式
	 * @return: null
	 */
	addClipRect: function(left, top, right, bottom, OriginType) {
		var eastSouth = EzServerClient.latLng([bottom, right]),
			westNorth = EzServerClient.latLng([top, left]),
			bounds = EzServerClient.latLngBounds(eastSouth, westNorth);

		var data = this.getGpsInfoByBounds(bounds);
		this.GpsView.setData(data);
		this.map.fitBounds(bounds);
	},

	/**
	 * @description: 在统计机构下可见GPS数量以及警种下可见GPS数量时，通过此方法可按照状态排除一些GPS
	 * @param: status -->int
	 * @return: null
	 */
	addExcludeStatByStatus: function(status) {
		var currentGpsInfoArray = new Array(), 
			tempArr = this.GpsInfoArray,
 			bounds = this._getCurrentViewBounds();

		if (!tempArr) {
			return;
		}

		for (var i = 0; i < tempArr.length; i++) {
			if (bounds.contains(tempArr[i].getLatlngOfGPSInfo()) && tempArr[i]['Status'] != status) {
				currentGpsInfoArray.push(tempArr[i]);
			}
		}
		this.GpsView.setData(currentGpsInfoArray);
	},

	/**
	 * @description: 设置监控区域,在初始化时，在options中设置MonitorRegion为TRUE，否则，默认为窗口
	 * @param: RegionID,coord -->String coord为对角线坐标串,以", "分割
	 * @return: null
	 */
	addMonitorRegion: function(RegionID, coord) {
		var monitorRegion = this._monitorRegion = {};
		var coordArr = coord.split(",");

		var eastSouth = EzServerClient.latLng([parseFloat(coord[2]), parseFloat(coord[3])]),
			westNorth = EzServerClient.latLng([parseFloat(coord[0]), parseFloat(coord[1])]);

		monitorRegion.RegionID = RegionID;
		monitorRegion.Region = EzServerClient.LatLngBounds(westNorth, eastSouth);
	},

	getGpsInfoArrayGlobal: function() {
		return this.GpsInfoArray;
	},

	/**
	 * @description: 闪烁GPS车辆
	 * @param: GpsID,Count,Time-->string,long,long-->GPS车辆ID,闪烁次数,闪烁间隔，以毫秒为单位
	 * @return: null
	 * ????????????????????????????????????????????????????????????????????????????????????????
	 */
	flashGPS: function(GpsID, Count, Time) {
		var data = this.getGpsInfoArrayGlobal();
		for (var i = 0; i < data.length; i++) {
			if (GpsID == data[i]['GpsID']) {
				this.map.panTo([data[i]['y'], data[i]['x']]);
				this.setGpsInfoArrayOnCurrentView(this.getGpsInfoArrayOnCurrentView());
			}
			else{
				return;
			}
		}
	}
});

/**
 * GPS Information存储接口
 */
var GPSInfo = EzServerClient.Class.extend({
	initialize: function() {
		this.CallNo = "-1";
		this.CarType = "-1";
		this.dir = 0;
		this.GpsID = "-1";
		this.Org = "-1";
		this.Speed = 0;
		this.Status = 0;
		this.x = 0;
		this.y = 0;
	},
	

	statics : {
		/**
		 * @description: 更新该Gps车辆信息<static>
		 * @param: string-->id
		 * @return: EzServerClient.LatLng
		 */
		updateGpsInfoById : function(id,data) {
			(function(){
				$.ajax({
					url : 'http://172.18.69.54:8080/ProxyProject1/ServletProxy',
					type : 'POST',
					async : false,
					data : {
						url : "http://172.25.18.156:8080/gpsServer/LbsManagerServlet",
						method : "getLocationByDeviceIdForMDM",
						id : id
					},
					dataType : 'json',
					success : function(json) {
						if (json.code == '0'){
							jsonData = json.result;
							data['Speed'] = (data['Speed'] != jsonData['speed']) ? jsonData['speed'] : data['Speed'];
							data['dir'] = (data['dir'] != jsonData['dir']) ? jsonData['dir'] : data['dir'];
							data['x'] = (data['x'] != jsonData['x']) ? jsonData['x'] : data['x'];
							data['y'] = (data['y'] != jsonData['y']) ? jsonData['y'] : data['y'];
						}
					},
					error : function() {
						console.log("连接失败!");
					}
				});
			})(data);
		}
	},

	getGPSInfoByAjax : function() {
		$.ajax({
			url : 'http://172.18.69.54:8080/ProxyProject/ServletProxy',
			type : 'POST',
			data : {
				url : "http://172.25.18.156:8080/gpsServer/LbsManagerServlet",
				method : "getLocationByRectForMDM",
				appKey : "admin",
				geo : JSON.stringify({
					"type" : "rect",
					"shape" : "116.30,39.98,116.31,39.986"
				})
			},
			dataType : 'json',
			success : function(json) {
				alert(json);
			},
			error : function() {
				alert("fail!");
			}
		});
		// 
		// var jsonp = EzServerClient.DomUtil.create('script');
		// jsonp.type = 'text/javascript';
  //   	jsonp.src = 'http://172.25.18.156:8080/gpsServer/LbsManagerServlet?method=getLocationByRectForMDM&appKey=admin&geo={"type":"rect","shape":"116.30,39.98,116.31,39.986"}';  
	},
	
	/**
	 * @description: 获取当前GPSInfo对象的经纬度
	 * @param: null
	 * @return: EzServerClient.LatLng
	 */
	getLatlngOfGPSInfo : function() {
		return EzServerClient.latLng([ this.y, this.x ]);
	}
});

/**
 * PointStyle GPSInfo对象canvas画布展示样式控制类<普通类，非组件类>
 * 通过GPSCtrlPtr对象方法getPointStyleObject()获得其对象
 * 该类设置默认属性
 */
var PointStyle = function(ctx) {
	this.ctx = ctx;
	this.Color = this.ctx.fillStyle = "#032329";
	this.PointSize = 10;
}

/**
 * Test GPS View
 */
var GPSs = EzServerClient.FeatureGroup.extend({
	initialize: function(latlngs, options) {
		this._layers = {};
		this._options = options;
		this.setLatLngs(latlngs);
	},

	setLatLngs: function (latlngs) {
		var i = 0,
		    len = latlngs.length;

		this.eachLayer(function (layer) {
			if (i < len) {
				layer.setLatLngs(latlngs[i++]);
			} else {
				this.removeLayer(layer);
			}
		}, this);

		while (i < len) {
			this.addLayer(new EzServerClient.circleMarker(latlngs[i++], this._options));
		}

		return this;
	},

	getLatLngs: function () {
		var latlngs = [];

		this.eachLayer(function (layer) {
			latlngs.push(layer.getLatLngs());
		});

		return latlngs;
	},

	/**
	 * @description: 创建GPSCtrlPtr对象
	 * @param: null
	 * @return: GPSCtrlPtr
	 */
	createGPSCtrlPtrObject: function() {
		var gpsCtrl = this.gpsCtrlPtr = new GPSCtrlPtr(this);
		return gpsCtrl;
	}
});

/*
 * EzServerClient.Control is a base class for implementing map controls. Handles positioning.
 * All other controls extend from this class.
 */

EzServerClient.Control = EzServerClient.Class.extend({
	options: {
		position: 'topright'
	},

	initialize: function (options) {
		EzServerClient.setOptions(this, options);
	},

	getPosition: function () {
		return this.options.position;
	},

	setPosition: function (position) {
		var map = this._map;

		if (map) {
			map.removeControl(this);
		}

		this.options.position = position;

		if (map) {
			map.addControl(this);
		}

		return this;
	},

	getContainer: function () {
		return this._container;
	},

	addTo: function (map) {
		this._map = map;

		var container = this._container = this.onAdd(map),
		    pos = this.getPosition(),
		    corner = map._controlCorners[pos];

		EzServerClient.DomUtil.addClass(container, 'leaflet-control');

		if (pos.indexOf('bottom') !== -1) {
			corner.insertBefore(container, corner.firstChild);
		} else {
			corner.appendChild(container);
		}

		return this;
	},

	removeFrom: function (map) {
		var pos = this.getPosition(),
		    corner = map._controlCorners[pos];

		corner.removeChild(this._container);
		this._map = null;

		if (this.onRemove) {
			this.onRemove(map);
		}

		return this;
	},

	_refocusOnMap: function () {
		if (this._map) {
			this._map.getContainer().focus();
		}
	}
});

EzServerClient.control = function (options) {
	return new EzServerClient.Control(options);
};


// adds control-related methods to EzServerClient.Map

EzServerClient.Map.include({
	addControl: function (control) {
		control.addTo(this);
		return this;
	},

	removeControl: function (control) {
		control.removeFrom(this);
		return this;
	},

	_initControlPos: function () {
		var corners = this._controlCorners = {},
		    l = 'leaflet-',
		    container = this._controlContainer =
		            EzServerClient.DomUtil.create('div', l + 'control-container', this._container);

		function createCorner(vSide, hSide) {
			var className = l + vSide + ' ' + l + hSide;

			corners[vSide + hSide] = EzServerClient.DomUtil.create('div', className, container);
		}

		createCorner('top', 'left');
		createCorner('top', 'right');
		createCorner('bottom', 'left');
		createCorner('bottom', 'right');
	},

	_clearControlPos: function () {
		this._container.removeChild(this._controlContainer);
	}
});


/*
 * EzServerClient.Control.Zoom is used for the default zoom buttons on the map.
 */

EzServerClient.Control.Zoom = EzServerClient.Control.extend({
	options: {
		position: 'topleft',
		zoomInText: '+',
		zoomInTitle: 'Zoom in',
		zoomOutText: '-',
		zoomOutTitle: 'Zoom out'
	},

	onAdd: function (map) {
		var zoomName = 'leaflet-control-zoom',
		    container = EzServerClient.DomUtil.create('div', zoomName + ' leaflet-bar');

		this._map = map;

		this._zoomInButton  = this._createButton(
		        this.options.zoomInText, this.options.zoomInTitle,
		        zoomName + '-in',  container, this._zoomIn,  this);
		this._zoomOutButton = this._createButton(
		        this.options.zoomOutText, this.options.zoomOutTitle,
		        zoomName + '-out', container, this._zoomOut, this);

		this._updateDisabled();
		map.on('zoomend zoomlevelschange', this._updateDisabled, this);

		return container;
	},

	onRemove: function (map) {
		map.off('zoomend zoomlevelschange', this._updateDisabled, this);
	},

	_zoomIn: function (e) {
		this._map.zoomIn(e.shiftKey ? 3 : 1);
	},

	_zoomOut: function (e) {
		this._map.zoomOut(e.shiftKey ? 3 : 1);
	},

	_createButton: function (html, title, className, container, fn, context) {
		var link = EzServerClient.DomUtil.create('a', className, container);
		link.innerHTML = html;
		link.href = '#';
		link.title = title;

		var stop = EzServerClient.DomEvent.stopPropagation;

		EzServerClient.DomEvent
		    .on(link, 'click', stop)
		    .on(link, 'mousedown', stop)
		    .on(link, 'dblclick', stop)
		    .on(link, 'click', EzServerClient.DomEvent.preventDefault)
		    .on(link, 'click', fn, context)
		    .on(link, 'click', this._refocusOnMap, context);

		return link;
	},

	_updateDisabled: function () {
		var map = this._map,
			className = 'leaflet-disabled';

		EzServerClient.DomUtil.removeClass(this._zoomInButton, className);
		EzServerClient.DomUtil.removeClass(this._zoomOutButton, className);

		if (map._zoom === map.getMinZoom()) {
			EzServerClient.DomUtil.addClass(this._zoomOutButton, className);
		}
		if (map._zoom === map.getMaxZoom()) {
			EzServerClient.DomUtil.addClass(this._zoomInButton, className);
		}
	}
});

EzServerClient.Map.mergeOptions({
	zoomControl: true
});

EzServerClient.Map.addInitHook(function () {
	if (this.options.zoomControl) {
		this.zoomControl = new EzServerClient.Control.Zoom();
		this.addControl(this.zoomControl);
	}
});

EzServerClient.control.zoom = function (options) {
	return new EzServerClient.Control.Zoom(options);
};



EzServerClient.Control.LayersButton = EzServerClient.Control.extend({
    options: {
        position: 'topright',
        title: ''
    },

    onAdd: function () {
        // var container = EzServerClient.DomUtil.create('div');

        var container = EzServerClient.DomUtil.create('div', 'leaflet-bar-Ezmap leaflet-Ezmap');

        this.link = EzServerClient.DomUtil.create('a','leaflet-bar-Ezmap', container);
        // this.link = EzServerClient.DomUtil.create('a', 'leaflet-bar-part', container);
        // 
        var i_value = EzServerClient.DomUtil.create('i','fa fa-EzServerClient.',this.link);

        // var i_value = EzServerClient.DomUtil.create('i', 'fa fa-EzServerClient.', this.link);
        // 
        i_value.innerText = this.options.title;
        this.link.href = '#';

        EzServerClient.DomEvent.on(this.link, 'click', this._click, this);
        this.link.title = this.options.title;

        return container;
    },
    
    intendedFunction: function(){
      var tempZoom = this._map.getZoom();
      var tempCenter = this._map.getCenter();

      var objLayer = this.options.layer;
      var objMap = this._map;
      var domName=objMap._container.id;

      if (objLayer) {
        if (objLayer.options.isEzMap) {

          for(var i in objMap._layers){
            objMap.removeLayer(objMap._layers[i]);
          }

          objMap.options.crs = EzServerClient.CRS.EPSG4326Ez;
          objMap.options.isEzMap = true;

          objMap._resetView(tempCenter,tempZoom);
          objMap.addLayer(objLayer);
          

        }else{
          for(var i in objMap._layers){
            objMap.removeLayer(objMap._layers[i]);
          }

          objMap.options.crs = EzServerClient.CRS.EPSG3857;
          objMap.options.isEzMap = false;

          objMap._resetView(tempCenter,tempZoom);
          objMap.addLayer(objLayer);
          
        }
      }
    },
      
    _click: function (e) {
        EzServerClient.DomEvent.stopPropagation(e);
        EzServerClient.DomEvent.preventDefault(e);
        this.intendedFunction();
    }
});

EzServerClient.layersButton = function( btnTitle , btnMap ,layer) {
  var newControl = new EzServerClient.Control.LayersButton;
  
  if (btnTitle) newControl.options.title = btnTitle;

  newControl.options.layer = layer;
  
  if ( btnMap ){
    newControl.addTo(btnMap);
  } else {
    newControl.addTo(map);
  }
  return newControl;
};


/*
 *  Simple navigation control that allows back ，forward ，left and right navigation through map's view history
 */
EzServerClient.Control.NavButton = EzServerClient.Control.extend({

	options: {
		position: 'topleft'
	},

	onAdd: function(map) {

		var className = 'leaflet-control-NavButton',
			container = EzServerClient.DomUtil.create('div', className);

		EzServerClient.DomEvent.disableClickPropagation(container);

		this._map = map;

		var panCircleContainer = this._createPanCircle(className + '-panCircle', container, map);

		className += '-panCircle';

		this._panN_Button = this._createButton('North', className + '-panN control-navButton', panCircleContainer, this._panNorth, this);

		this._panW_Button = this._createButton('West', className + '-panW control-navButton', panCircleContainer, this._panWest, this);

		this._panS_Button = this._createButton('South', className + '-panS control-navButton', panCircleContainer, this._panSouth, this);

		this._panE_Button = this._createButton('East', className + '-panE control-navButton', panCircleContainer, this._panEast, this);



		return container;
	},

	_createPanCircle: function(className, container, map) {
		var panCircle = EzServerClient.DomUtil.create('div', className, container);
		return panCircle;
	},

	_createButton: function(title,className, container, fn, context) {
		var linkdiv = EzServerClient.DomUtil.create('div', className, container);
		linkdiv.title = title;

		EzServerClient.DomEvent
			.on(linkdiv, 'click', EzServerClient.DomEvent.preventDefault)
			.on(linkdiv, 'click', fn, context);


		return linkdiv;
	},

	_panNorth: function() {
		this._map.panBy(this._map.keyboard._panKeys[38]);
	},

	_panWest: function() {
		this._map.panBy(this._map.keyboard._panKeys[37]);
	},

	_panSouth: function() {
		this._map.panBy(this._map.keyboard._panKeys[40]);
	},

	_panEast: function() {
		this._map.panBy(this._map.keyboard._panKeys[39]);
	}

});

EzServerClient.Map.mergeOptions({
	navButtonControl: true
});

// EzServerClient.Map.addInitHook(function() {
// 	if (this.options.navButtonControl) {
// 		this.navButtonControl = EzServerClient.control.navButton().addTo(this);
// 	}
// });

EzServerClient.control.navButton = function(options) {
	return new EzServerClient.Control.NavButton(options);
};

/*
 *  Simple navigation control that allows back ，forward ，left and right navigation through map's view history
 */
EzServerClient.Control.NavButton2 = EzServerClient.Control.extend({

	options: {
		position: 'topleft'
	},

	onAdd: function(map) {

		var className = 'EzServerClient-control-NavButton',
			container = EzServerClient.DomUtil.create('div', className);

		EzServerClient.DomEvent.disableClickPropagation(container);

		this._map = map;

		var panCircleContainer = this._createPanCircle(className + '-panCircle', container, map);

		className += '-panCircle';

		this._panN_Button = this._createButton('North', className + '-panN control-navButton', panCircleContainer, this._panNorth, this);

		this._panW_Button = this._createButton('West', className + '-panW control-navButton', panCircleContainer, this._panWest, this);

		this._panS_Button = this._createButton('South', className + '-panS control-navButton', panCircleContainer, this._panSouth, this);

		this._panE_Button = this._createButton('East', className + '-panE control-navButton', panCircleContainer, this._panEast, this);



		return container;
	},

	_createPanCircle: function(className, container, map) {
		var panCircle = EzServerClient.DomUtil.create('div', className, container);
		return panCircle;
	},

	_createButton: function(title,className, container, fn, context) {
		var linkdiv = EzServerClient.DomUtil.create('div', className, container);
		linkdiv.title = title;

		EzServerClient.DomEvent
			.on(linkdiv, 'click', EzServerClient.DomEvent.preventDefault)
			.on(linkdiv, 'click', fn, context);


		return linkdiv;
	},

	_panNorth: function() {
		this._map.panBy(this._map.keyboard._panKeys[38]);
	},

	_panWest: function() {
		this._map.panBy(this._map.keyboard._panKeys[37]);
	},

	_panSouth: function() {
		this._map.panBy(this._map.keyboard._panKeys[40]);
	},

	_panEast: function() {
		this._map.panBy(this._map.keyboard._panKeys[39]);
	}

});

EzServerClient.Map.mergeOptions({
	navButtonControl: true
});

// EzServerClient.Map.addInitHook(function() {
// 	if (this.options.navButtonControl) {
// 		this.navButtonControl = EzServerClient.control.navButton2().addTo(this);
// 	}
// });

EzServerClient.control.navButton2 = function(options) {
	return new EzServerClient.Control.NavButton2(options);
};

/*
 * EzServerClient.Control.Attribution is used for displaying attribution on the map (added by default).
 */

EzServerClient.Control.Attribution = EzServerClient.Control.extend({
	options: {
		position: 'bottomright',
		prefix: '<a href="http://www.easymap.com.cn" title="A JS library for interactive maps">EzServerClient</a>'
	},

	initialize: function (options) {
		EzServerClient.setOptions(this, options);

		this._attributions = {};
	},

	onAdd: function (map) {
		this._container = EzServerClient.DomUtil.create('div', 'leaflet-control-attribution');
		EzServerClient.DomEvent.disableClickPropagation(this._container);

		for (var i in map._layers) {
			if (map._layers[i].getAttribution) {
				this.addAttribution(map._layers[i].getAttribution());
			}
		}
		
		map
		    .on('layeradd', this._onLayerAdd, this)
		    .on('layerremove', this._onLayerRemove, this);

		this._update();

		return this._container;
	},

	onRemove: function (map) {
		map
		    .off('layeradd', this._onLayerAdd)
		    .off('layerremove', this._onLayerRemove);

	},

	setPrefix: function (prefix) {
		this.options.prefix = prefix;
		this._update();
		return this;
	},

	addAttribution: function (text) {
		if (!text) { return; }

		if (!this._attributions[text]) {
			this._attributions[text] = 0;
		}
		this._attributions[text]++;

		this._update();

		return this;
	},

	removeAttribution: function (text) {
		if (!text) { return; }

		if (this._attributions[text]) {
			this._attributions[text]--;
			this._update();
		}

		return this;
	},

	_update: function () {
		if (!this._map) { return; }

		var attribs = [];

		for (var i in this._attributions) {
			if (this._attributions[i]) {
				attribs.push(i);
			}
		}

		var prefixAndAttribs = [];

		if (this.options.prefix) {
			prefixAndAttribs.push(this.options.prefix);
		}
		if (attribs.length) {
			prefixAndAttribs.push(attribs.join(', '));
		}

		this._container.innerHTML = prefixAndAttribs.join(' | ');
	},

	_onLayerAdd: function (e) {
		if (e.layer.getAttribution) {
			this.addAttribution(e.layer.getAttribution());
		}
	},

	_onLayerRemove: function (e) {
		if (e.layer.getAttribution) {
			this.removeAttribution(e.layer.getAttribution());
		}
	}
});

EzServerClient.Map.mergeOptions({
	attributionControl: true
});

EzServerClient.Map.addInitHook(function () {
	if (this.options.attributionControl) {
		this.attributionControl = (new EzServerClient.Control.Attribution()).addTo(this);
	}
});

EzServerClient.control.attribution = function (options) {
	return new EzServerClient.Control.Attribution(options);
};


/*
 * EzServerClient.Control.Scale is used for displaying metric/imperial scale on the map.
 */

EzServerClient.Control.Scale = EzServerClient.Control.extend({
	options: {
		position: 'bottomleft',
		maxWidth: 100,
		metric: true,
		imperial: true,
		updateWhenIdle: false
	},

	onAdd: function (map) {
		this._map = map;

		var className = 'leaflet-control-scale',
		    container = EzServerClient.DomUtil.create('div', className),
		    options = this.options;

		this._addScales(options, className, container);

		map.on(options.updateWhenIdle ? 'moveend' : 'move', this._update, this);
		map.whenReady(this._update, this);

		return container;
	},

	onRemove: function (map) {
		map.off(this.options.updateWhenIdle ? 'moveend' : 'move', this._update, this);
	},

	_addScales: function (options, className, container) {
		if (options.metric) {
			this._mScale = EzServerClient.DomUtil.create('div', className + '-line', container);
		}
		if (options.imperial) {
			this._iScale = EzServerClient.DomUtil.create('div', className + '-line', container);
		}
	},

	_update: function () {
		var bounds = this._map.getBounds(),
		    centerLat = bounds.getCenter().lat,
		    halfWorldMeters = 6378137 * Math.PI * Math.cos(centerLat * Math.PI / 180),
		    dist = halfWorldMeters * (bounds.getNorthEast().lng - bounds.getSouthWest().lng) / 180,

		    size = this._map.getSize(),
		    options = this.options,
		    maxMeters = 0;

		if (size.x > 0) {
			maxMeters = dist * (options.maxWidth / size.x);
		}

		this._updateScales(options, maxMeters);
	},

	_updateScales: function (options, maxMeters) {
		if (options.metric && maxMeters) {
			this._updateMetric(maxMeters);
		}

		if (options.imperial && maxMeters) {
			this._updateImperial(maxMeters);
		}
	},

	_updateMetric: function (maxMeters) {
		var meters = this._getRoundNum(maxMeters);

		this._mScale.style.width = this._getScaleWidth(meters / maxMeters) + 'px';
		this._mScale.innerHTML = meters < 1000 ? meters + ' m' : (meters / 1000) + ' km';
	},

	_updateImperial: function (maxMeters) {
		var maxFeet = maxMeters * 3.2808399,
		    scale = this._iScale,
		    maxMiles, miles, feet;

		if (maxFeet > 5280) {
			maxMiles = maxFeet / 5280;
			miles = this._getRoundNum(maxMiles);

			scale.style.width = this._getScaleWidth(miles / maxMiles) + 'px';
			scale.innerHTML = miles + ' mi';

		} else {
			feet = this._getRoundNum(maxFeet);

			scale.style.width = this._getScaleWidth(feet / maxFeet) + 'px';
			scale.innerHTML = feet + ' ft';
		}
	},

	_getScaleWidth: function (ratio) {
		return Math.round(this.options.maxWidth * ratio) - 10;
	},

	_getRoundNum: function (num) {
		var pow10 = Math.pow(10, (Math.floor(num) + '').length - 1),
		    d = num / pow10;

		d = d >= 10 ? 10 : d >= 5 ? 5 : d >= 3 ? 3 : d >= 2 ? 2 : 1;

		return pow10 * d;
	}
});

EzServerClient.control.scale = function (options) {
	return new EzServerClient.Control.Scale(options);
};


/*
 * EzServerClient.Control.Layers is a control to allow users to switch between different layers on the map.
 */

EzServerClient.Control.Layers = EzServerClient.Control.extend({
	options: {
		collapsed: true,
		position: 'topright',
		autoZIndex: true
	},

	initialize: function (baseLayers, overlays, options) {
		EzServerClient.setOptions(this, options);

		this._layers = {};
		this._lastZIndex = 0;
		this._handlingClick = false;

		for (var i in baseLayers) {
			this._addLayer(baseLayers[i], i);
		}

		for (i in overlays) {
			this._addLayer(overlays[i], i, true);
		}
	},

	onAdd: function (map) {
		this._initLayout();
		this._update();

		map
		    .on('layeradd', this._onLayerChange, this)
		    .on('layerremove', this._onLayerChange, this);

		return this._container;
	},

	onRemove: function (map) {
		map
		    .off('layeradd', this._onLayerChange, this)
		    .off('layerremove', this._onLayerChange, this);
	},

	addBaseLayer: function (layer, name) {
		this._addLayer(layer, name);
		this._update();
		return this;
	},

	addOverlay: function (layer, name) {
		this._addLayer(layer, name, true);
		this._update();
		return this;
	},

	removeLayer: function (layer) {
		var id = EzServerClient.stamp(layer);
		delete this._layers[id];
		this._update();
		return this;
	},

	_initLayout: function () {
		var className = 'leaflet-control-layers',
		    container = this._container = EzServerClient.DomUtil.create('div', className);

		//Makes this work on IE10 Touch devices by stopping it from firing a mouseout event when the touch is released
		container.setAttribute('aria-haspopup', true);

		if (!EzServerClient.Browser.touch) {
			EzServerClient.DomEvent
				.disableClickPropagation(container)
				.disableScrollPropagation(container);
		} else {
			EzServerClient.DomEvent.on(container, 'click', EzServerClient.DomEvent.stopPropagation);
		}

		var form = this._form = EzServerClient.DomUtil.create('form', className + '-list');

		if (this.options.collapsed) {
			if (!EzServerClient.Browser.android) {
				EzServerClient.DomEvent
				    .on(container, 'mouseover', this._expand, this)
				    .on(container, 'mouseout', this._collapse, this);
			}
			var link = this._layersLink = EzServerClient.DomUtil.create('a', className + '-toggle', container);
			link.href = '#';
			link.title = 'Layers';

			if (EzServerClient.Browser.touch) {
				EzServerClient.DomEvent
				    .on(link, 'click', EzServerClient.DomEvent.stop)
				    .on(link, 'click', this._expand, this);
			}
			else {
				EzServerClient.DomEvent.on(link, 'focus', this._expand, this);
			}
			//Work around for Firefox android issue https://github.com/Leaflet/Leaflet/issues/2033
			EzServerClient.DomEvent.on(form, 'click', function () {
				setTimeout(EzServerClient.bind(this._onInputClick, this), 0);
			}, this);

			this._map.on('click', this._collapse, this);
			// TODO keyboard accessibility
		} else {
			this._expand();
		}

		this._baseLayersList = EzServerClient.DomUtil.create('div', className + '-base', form);
		this._separator = EzServerClient.DomUtil.create('div', className + '-separator', form);
		this._overlaysList = EzServerClient.DomUtil.create('div', className + '-overlays', form);

		container.appendChild(form);
	},

	_addLayer: function (layer, name, overlay) {
		var id = EzServerClient.stamp(layer);

		this._layers[id] = {
			layer: layer,
			name: name,
			overlay: overlay
		};

		if (this.options.autoZIndex && layer.setZIndex) {
			this._lastZIndex++;
			layer.setZIndex(this._lastZIndex);
		}
	},

	_update: function () {
		if (!this._container) {
			return;
		}

		this._baseLayersList.innerHTML = '';
		this._overlaysList.innerHTML = '';

		var baseLayersPresent = false,
		    overlaysPresent = false,
		    i, obj;

		for (i in this._layers) {
			obj = this._layers[i];
			this._addItem(obj);
			overlaysPresent = overlaysPresent || obj.overlay;
			baseLayersPresent = baseLayersPresent || !obj.overlay;
		}

		this._separator.style.display = overlaysPresent && baseLayersPresent ? '' : 'none';
	},

	_onLayerChange: function (e) {
		var obj = this._layers[EzServerClient.stamp(e.layer)];

		if (!obj) { return; }

		if (!this._handlingClick) {
			this._update();
		}

		var type = obj.overlay ?
			(e.type === 'layeradd' ? 'overlayadd' : 'overlayremove') :
			(e.type === 'layeradd' ? 'baselayerchange' : null);

		if (type) {
			this._map.fire(type, obj);
		}
	},

	// IE7 bugs out if you create a radio dynamically, so you have to do it this hacky way (see http://bit.EzServerClient./PqYLBe)
	_createRadioElement: function (name, checked) {

		var radioHtml = '<input type="radio" class="leaflet-control-layers-selector" name="' + name + '"';
		if (checked) {
			radioHtml += ' checked="checked"';
		}
		radioHtml += '/>';

		var radioFragment = document.createElement('div');
		radioFragment.innerHTML = radioHtml;

		return radioFragment.firstChild;
	},

	_addItem: function (obj) {
		var label = document.createElement('label'),
		    input,
		    checked = this._map.hasLayer(obj.layer);

		if (obj.overlay) {
			input = document.createElement('input');
			input.type = 'checkbox';
			input.className = 'leaflet-control-layers-selector';
			input.defaultChecked = checked;
		} else {
			input = this._createRadioElement('leaflet-base-layers', checked);
		}

		input.layerId = EzServerClient.stamp(obj.layer);

		EzServerClient.DomEvent.on(input, 'click', this._onInputClick, this);

		var name = document.createElement('span');
		name.innerHTML = ' ' + obj.name;

		label.appendChild(input);
		label.appendChild(name);

		var container = obj.overlay ? this._overlaysList : this._baseLayersList;
		container.appendChild(label);

		return label;
	},

	_onInputClick: function () {
		var i, input, obj,
		    inputs = this._form.getElementsByTagName('input'),
		    inputsLen = inputs.length;

		/**
		 * @author [qianleyi]
		 * @description [切换地图（不同坐标系的）]
		 */
		var tempCenter=this._map.getCenter();
		var tempZoom=this._map.getZoom();
		var objMap = this._map;

		this._handlingClick = true;

		for (i = 0; i < inputsLen; i++) {
			input = inputs[i];
			obj = this._layers[input.layerId];

			if (input.checked && !this._map.hasLayer(obj.layer)) {
				if (obj.layer.options.isEzMap) {
					objMap.options.crs = obj.layer.options.crs;
					objMap.options.isEzMap = true;
					objMap.setView(tempCenter, tempZoom);

					objMap.addLayer(obj.layer);
					if (objMap._hotSpotLayer !== null) {
						obj.layer.bringToBack();
					}
				}
				else{
					objMap.options.crs = obj.layer.options.crs;
					objMap.options.isEzMap = false;
					objMap.setView(tempCenter, tempZoom);

					objMap.addLayer(obj.layer);
					if (objMap._hotSpotLayer !== null) {
						obj.layer.bringToBack();
					}
				}

			} else if (!input.checked && this._map.hasLayer(obj.layer)) {
				this._map.removeLayer(obj.layer);
			}
		}

		this._handlingClick = false;

		this._refocusOnMap();
	},

	_expand: function () {
		EzServerClient.DomUtil.addClass(this._container, 'leaflet-control-layers-expanded');
	},

	_collapse: function () {
		this._container.className = this._container.className.replace(' leaflet-control-layers-expanded', '');
	}
});

EzServerClient.control.layers = function (baseLayers, overlays, options) {
	return new EzServerClient.Control.Layers(baseLayers, overlays, options);
};


EzServerClient.Control.Zoomslider = EzServerClient.Control.extend({
	options: {
		collapsed: true,
		position: 'topleft',
		// height in px of zoom-slider.png
		stepHeight: 9
	},

	onAdd: function(map) {
		var className = 'leaflet-control-zoomslider',
			container = EzServerClient.DomUtil.create('div', className);

		EzServerClient.DomEvent.disableClickPropagation(container);

		this._map = map;

		this._zoomInButton = this._createButton('Zoom in', className + '-in', container, this._zoomIn, this);
		this._createSlider(className + '-slider', container, map);
		this._zoomOutButton = this._createButton('Zoom out', className + '-out', container, this._zoomOut, this);

		// map.on('layeradd', this._refresh, this);
		/**
		 * @author [qianleyi]
		 * @description [绑定事件使得累加_refresh（）导致内存泄露]
		 */
		map.addOneTimeEventListener('layeradd layerremove', this._refresh, this);

		map.whenReady(function() {
			this._snapToSliderValue();
			map.on('zoomend', this._snapToSliderValue, this);
			// map.on('zoomstart',this._expand,this);
			// map.on('zoomend',this._collapse,this);
		}, this);

		return container;
	},

	onRemove: function(map) {
		map.off('zoomend', this._snapToSliderValue);
		map.off('layeradd layerremove', this._refresh);
	},

	_refresh: function() {
		this._map
			.removeControl(this)
			.addControl(this);
	},

	_createSlider: function(className, container, map) {
		var zoomLevels = map.getMaxZoom() - map.getMinZoom();
		// This means we have no tilelayers (or that they are setup in a strange way).
		// Either way we don't want to add a slider here.
		if (zoomLevels == Infinity) {
			return undefined;
		}
		this._sliderHeight = this.options.stepHeight * zoomLevels;

		var wrapper = EzServerClient.DomUtil.create('div', className + '-wrap', container);
		wrapper.style.height = (this._sliderHeight + 5) + "px";
		var slider = EzServerClient.DomUtil.create('div', className, wrapper);
		// slider.setAttribute('aria-haspopup', true);

		this._knobset = EzServerClient.DomUtil.create('div', className + '-knobset', slider);

		this._knob = EzServerClient.DomUtil.create('div', className + '-knob', this._knobset);


		if (this.options.collapsed) {
			EzServerClient.DomEvent.on(slider, 'mouseover', this._expand, this);
			EzServerClient.DomEvent.on(slider, 'mouseout', this._collapse, this);

			this._knobTip = EzServerClient.DomUtil.create('div', className + '-knobTip', this._knobset);
		 // this._knoba = EzServerClient.DomUtil.create('a', className + '-knobTip-a', this._knobTip);

			this._collapse();
		} else {
			this._expand();
		}

		// EzServerClient.DomEvent.on(this._map._container, 'mousewheel', this._onWheelScroll, this);


		this._draggable = this._createDraggable();
		this._draggable.enable();

		EzServerClient.DomEvent.on(slider, 'click', this._onSliderClick, this);

		return slider;
	},

	_zoomIn: function(e) {
		this._map.zoomIn(e.shiftKey ? 3 : 1);
	},

	_zoomOut: function(e) {
		this._map.zoomOut(e.shiftKey ? 3 : 1);
	},

	_createButton: function(title, className, container, fn, context) {
		var link = EzServerClient.DomUtil.create('a', className, container);
		link.href = '#';
		link.title = title;

		EzServerClient.DomEvent
			.on(link, 'click', EzServerClient.DomEvent.preventDefault)
			.on(link, 'click', fn, context);

		return link;
	},

	_createDraggable: function() {
		EzServerClient.DomUtil.setPosition(this._knob, EzServerClient.point(0, 0));
		EzServerClient.DomEvent.disableClickPropagation(this._knob);

		var bounds = new EzServerClient.Bounds(
			EzServerClient.point(0, 0),
			EzServerClient.point(0, this._sliderHeight)
		);
		var draggable = new EzServerClient.BoundedDraggable(this._knob,
				this._knob,
				bounds)
			.on('drag', this._snap, this)
			.on('dragend', this._setZoom, this);

		return draggable;
	},

	_snap: function() {
		this._snapToSliderValue(this._posToSliderValue());
	},
	_setZoom: function() {
		this._map.setZoom(this._toZoomLevel(this._posToSliderValue()));
	},

	_onSliderClick: function(e) {
		var first = (e.touches && e.touches.length === 1 ? e.touches[0] : e);
		var offset = first.offsetY ? first.offsetY : EzServerClient.DomEvent.getMousePosition(first).y - EzServerClient.DomUtil.getViewportOffset(this._knob).y;
		var value = this._posToSliderValue(offset - this._knob.offsetHeight / 2);
		this._snapToSliderValue(value);
		this._map.setZoom(this._toZoomLevel(value));
	},

	_posToSliderValue: function(pos) {
		pos = isNaN(pos) ? EzServerClient.DomUtil.getPosition(this._knob).y : pos;
		return Math.round((this._sliderHeight - pos) / this.options.stepHeight);
	},

	_snapToSliderValue: function(sliderValue) {
		this._updateDisabled();
		if (this._knob) {
			sliderValue = isNaN(sliderValue) ? this._getSliderValue() : sliderValue;
			var y = this._sliderHeight - (sliderValue * this.options.stepHeight);
			EzServerClient.DomUtil.setPosition(this._knob, EzServerClient.point(0, y));
		}
		if (this._knobTip) {
			sliderValue = isNaN(sliderValue) ? this._getSliderValue() : sliderValue;
			var y = this._sliderHeight - (sliderValue * this.options.stepHeight);
			EzServerClient.DomUtil.setPosition(this._knobTip, EzServerClient.point(0, y));
			this._knoba;
		}
	},
	_toZoomLevel: function(sliderValue) {
		return sliderValue + this._map.getMinZoom();
	},
	_toSliderValue: function(zoomLevel) {
		return zoomLevel - this._map.getMinZoom();
	},
	_getSliderValue: function() {
		return this._toSliderValue(this._map.getZoom());
	},

	_expand: function() {
		if (this._knobTip.className === '') {
			this._knobTip.className = this._knobTip.className.replace('', 'leaflet-control-zoomslider-slider-knobTip');
		}
		this._showZoomLevel();
	},

	_collapse: function() {
		if (this._knobTip.className != '') {
			this._knobTip.className = this._knobTip.className.replace('leaflet-control-zoomslider-slider-knobTip', '');
		}
		this._knobTip.innerHTML = '';
	},

	_showZoomLevel:function(){
		this._knobTip.innerHTML = this._map._zoom;
	},

	_updateDisabled: function() {
		var map = this._map,
			className = 'leaflet-control-zoomslider-disabled';

		EzServerClient.DomUtil.removeClass(this._zoomInButton, className);
		EzServerClient.DomUtil.removeClass(this._zoomOutButton, className);

		if (map.getZoom() === map.getMinZoom()) {
			EzServerClient.DomUtil.addClass(this._zoomOutButton, className);
		}
		if (map.getZoom() === map.getMaxZoom()) {
			EzServerClient.DomUtil.addClass(this._zoomInButton, className);
		}
	}
});

EzServerClient.Map.mergeOptions({
	zoomControl: false,
	zoomsliderControl: true
});

// EzServerClient.Map.addInitHook(function() {
// 	if (this.options.zoomsliderControl) {
// 		this.zoomsliderControl=EzServerClient.control.zoomslider().addTo(this);
// 	}
// });

EzServerClient.control.zoomslider = function(options) {
	return new EzServerClient.Control.Zoomslider(options);
};


EzServerClient.BoundedDraggable = EzServerClient.Draggable.extend({
	initialize: function(element, dragStartTarget, bounds) {
		EzServerClient.Draggable.prototype.initialize.call(this, element, dragStartTarget);
		this._bounds = bounds;
		this.on('predrag', function() {
			if (!this._bounds.contains(this._newPos)) {
				this._newPos = this._fitPoint(this._newPos);
			}
		}, this);
	},
	_fitPoint: function(point) {
		var closest = EzServerClient.point(
			Math.min(point.x, this._bounds.max.x),
			Math.min(point.y, this._bounds.max.y)
		);
		closest.x = Math.max(closest.x, this._bounds.min.x);
		closest.y = Math.max(closest.y, this._bounds.min.y);
		return closest;
	}
});

EzServerClient.Control.Zoomslider2 = EzServerClient.Control.extend({
	options: {
		collapsed: true,
		position: 'topleft',
		// height in px of zoom-slider.png
		stepHeight: 7
	},

	onAdd: function(map) {
		var className = 'EzServerClient-control-zoomslider',
			container = EzServerClient.DomUtil.create('div', className);

		EzServerClient.DomEvent.disableClickPropagation(container);

		this._map = map;

		this._zoomlevelLabel = EzServerClient.DomUtil.create('div',className + '-label',container);
		this._zoomlevellabela = EzServerClient.DomUtil.create('a',className + '-label-a',this._zoomlevelLabel);
		this._zoomInButton = this._createButton('Zoom in', className + '-in', container, this._zoomIn, this);
		this._createSlider(className + '-slider', container, map);
		this._createZoomLabel(className + '-zoomlabel',container,map);
		this._zoomOutButton = this._createButton('Zoom out', className + '-out', container, this._zoomOut, this);

		// map.on('layeradd', this._refresh, this);
		/**
		 * @author [qianleyi]
		 * @description [绑定事件使得累加_refresh（）导致内存泄露]
		 */
		map.addOneTimeEventListener('layeradd layerremove', this._refresh, this);


		map.whenReady(function() {
			this._snapToSliderValue();
			map.on('zoomend', this._snapToSliderValue, this);
		}, this);

		return container;
	},

	onRemove: function(map) {
		map.off('zoomend', this._snapToSliderValue);
		map.off('layeradd layerremove', this._refresh);
	},

	_createZoomLabel:function(className, container, map){
		var labelContainer = EzServerClient.DomUtil.create('div', className,container);

		this._streetlabel = EzServerClient.DomUtil.create('div', '' , labelContainer);
		this._streetlabel.style.marginTop = (-1)*this.options.stepHeight*18+(-3) + 'px';

		this._cityLabel = EzServerClient.DomUtil.create('div', '' , labelContainer);
		this._cityLabel.style.marginTop = this.options.stepHeight * 5 + 'px';

		this._provinceLabel = EzServerClient.DomUtil.create('div', '' , labelContainer);
		this._provinceLabel.style.marginTop = this.options.stepHeight * 1 + 'px';

		this._countryLabel = EzServerClient.DomUtil.create('div', '' , labelContainer);
		this._countryLabel.style.marginTop = this.options.stepHeight * 1 + 'px';
	},

	_refresh: function() {
		this._map
			.removeControl(this)
			.addControl(this);
	},

	_createSlider: function(className, container, map) {
		var zoomLevels = map.getMaxZoom() - map.getMinZoom();
		// This means we have no tilelayers (or that they are setup in a strange way).
		// Either way we don't want to add a slider here.
		if (zoomLevels == Infinity) {
			return undefined;
		}
		this._sliderHeight = this.options.stepHeight * zoomLevels;

		var wrapper = EzServerClient.DomUtil.create('div', className + '-wrap', container);
		wrapper.style.height = (this._sliderHeight + 16) + "px";
		var slider = EzServerClient.DomUtil.create('div', className, wrapper);
		// slider.setAttribute('aria-haspopup', true);

		this._knobset = EzServerClient.DomUtil.create('div', className + '-knobset', slider);

		this._knob = EzServerClient.DomUtil.create('div', className + '-knob', this._knobset);


		this._draggable = this._createDraggable();
		this._draggable.enable();

		EzServerClient.DomEvent.on(slider, 'click', this._onSliderClick, this);

		EzServerClient.DomEvent.on(wrapper, 'mouseover', this._onSliderOver, this);
		EzServerClient.DomEvent.on(wrapper, 'mouseout', this._onSliderOut, this);

		return slider;
	},

	_zoomIn: function(e) {
		this._map.zoomIn(e.shiftKey ? 3 : 1);
	},

	_zoomOut: function(e) {
		this._map.zoomOut(e.shiftKey ? 3 : 1);
	},

	_onSliderOver:function(){
		if (this._streetlabel.className === '') {
			this._streetlabel.className = this._streetlabel.className.replace('', 'EzServerClient-control-zoomslider-zoomlabel-street');
		}
		if (this._cityLabel.className === '') {
			this._cityLabel.className = this._cityLabel.className.replace('', 'EzServerClient-control-zoomslider-zoomlabel-city');
		}
		if (this._provinceLabel.className === '') {
			this._provinceLabel.className = this._provinceLabel.className.replace('', 'EzServerClient-control-zoomslider-zoomlabel-province');
		}
		if (this._countryLabel.className === '') {
			this._countryLabel.className = this._countryLabel.className.replace('', 'EzServerClient-control-zoomslider-zoomlabel-country');
		}
	},

	_onSliderOut:function(){
		if (this._streetlabel.className !== '') {
			this._streetlabel.className = this._streetlabel.className.replace('EzServerClient-control-zoomslider-zoomlabel-street','');
		}
		if (this._cityLabel.className !== '') {
			this._cityLabel.className = this._cityLabel.className.replace('EzServerClient-control-zoomslider-zoomlabel-city','');
		}
		if (this._provinceLabel.className !== '') {
			this._provinceLabel.className = this._provinceLabel.className.replace('EzServerClient-control-zoomslider-zoomlabel-province','');
		}
		if (this._countryLabel.className !== '') {
			this._countryLabel.className = this._countryLabel.className.replace('EzServerClient-control-zoomslider-zoomlabel-country','');
		}
	},

	_createButton: function(title, className, container, fn, context) {
		var link = EzServerClient.DomUtil.create('a', className, container);
		link.href = '#';
		link.title = title;

		EzServerClient.DomEvent
			.on(link, 'click', EzServerClient.DomEvent.preventDefault)
			.on(link, 'click', fn, context);

		return link;
	},

	_createDraggable: function() {
		EzServerClient.DomUtil.setPosition(this._knob, EzServerClient.point(0, 0));
		EzServerClient.DomEvent.disableClickPropagation(this._knob);

		var bounds = new EzServerClient.Bounds(
			EzServerClient.point(0, 0),
			EzServerClient.point(0, this._sliderHeight)
		);
		var draggable = new EzServerClient.BoundedDraggable(this._knob,
				this._knob,
				bounds)
			.on('drag', this._snap, this)
			.on('dragend', this._setZoom, this);

		return draggable;
	},

	_snap: function() {
		this._snapToSliderValue(this._posToSliderValue());
	},
	_setZoom: function() {
		this._map.setZoom(this._toZoomLevel(this._posToSliderValue()));
	},

	_onSliderClick: function(e) {
		var first = (e.touches && e.touches.length === 1 ? e.touches[0] : e);
		var offset = first.offsetY ? first.offsetY : EzServerClient.DomEvent.getMousePosition(first).y - EzServerClient.DomUtil.getViewportOffset(this._knob).y;
		var value = this._posToSliderValue(offset - this._knob.offsetHeight / 2);
		this._snapToSliderValue(value);
		this._map.setZoom(this._toZoomLevel(value));
	},

	_posToSliderValue: function(pos) {
		pos = isNaN(pos) ? EzServerClient.DomUtil.getPosition(this._knob).y : pos;
		return Math.round((this._sliderHeight - pos) / this.options.stepHeight);
	},

	_snapToSliderValue: function(sliderValue) {
		this._updateDisabled();
		if (this._knob) {
			sliderValue = isNaN(sliderValue) ? this._getSliderValue() : sliderValue;
			var y = this._sliderHeight - (sliderValue * this.options.stepHeight);
			EzServerClient.DomUtil.setPosition(this._knob, EzServerClient.point(0, y));
		}
		if (this._zoomlevellabela) {
			this._zoomlevellabela.innerHTML = this._map.getZoom();
		}
	},
	_toZoomLevel: function(sliderValue) {
		return sliderValue + this._map.getMinZoom();
	},
	_toSliderValue: function(zoomLevel) {
		return zoomLevel - this._map.getMinZoom();
	},
	_getSliderValue: function() {
		return this._toSliderValue(this._map.getZoom());
	},

	_updateDisabled: function() {
		var map = this._map,
			className = 'EzServerClient-control-zoomslider-disabled';

		EzServerClient.DomUtil.removeClass(this._zoomInButton, className);
		EzServerClient.DomUtil.removeClass(this._zoomOutButton, className);

		if (map.getZoom() === map.getMinZoom()) {
			EzServerClient.DomUtil.addClass(this._zoomOutButton, className);
		}
		if (map.getZoom() === map.getMaxZoom()) {
			EzServerClient.DomUtil.addClass(this._zoomInButton, className);
		}
	}
});

EzServerClient.Map.mergeOptions({
	zoomControl: false,
	zoomsliderControl: true
});

// EzServerClient.Map.addInitHook(function() {
// 	if (this.options.zoomsliderControl) {
// 		this.zoomsliderControl=EzServerClient.control.zoomslider().addTo(this);
// 	}
// });

EzServerClient.control.zoomslider2 = function(options) {
	return new EzServerClient.Control.Zoomslider2(options);
};


EzServerClient.BoundedDraggable = EzServerClient.Draggable.extend({
	initialize: function(element, dragStartTarget, bounds) {
		EzServerClient.Draggable.prototype.initialize.call(this, element, dragStartTarget);
		this._bounds = bounds;
		this.on('predrag', function() {
			if (!this._bounds.contains(this._newPos)) {
				this._newPos = this._fitPoint(this._newPos);
			}
		}, this);
	},
	_fitPoint: function(point) {
		var closest = EzServerClient.point(
			Math.min(point.x, this._bounds.max.x),
			Math.min(point.y, this._bounds.max.y)
		);
		closest.x = Math.max(closest.x, this._bounds.min.x);
		closest.y = Math.max(closest.y, this._bounds.min.y);
		return closest;
	}
});

EzServerClient.Control.ZoomsliderForAnhui = (function () {

	var Knob = EzServerClient.Draggable.extend({
		initialize: function (element, stepHeight, knobHeight) {
			EzServerClient.Draggable.prototype.initialize.call(this, element, element);
			this._element = element;

			this._stepHeight = stepHeight;
			this._knobHeight = knobHeight;

			this.on('predrag', function () {
				this._newPos.x = 0;
				this._newPos.y = this._adjust(this._newPos.y);
			}, this);

		},

		_adjust: function (y) {
			var value = Math.round(this._toValue(y));
			value = Math.max(0, Math.min(this._maxValue, value));
			return this._toY(value);
		},

		// y = k*v + m
		_toY: function (value) {
			return this._k * value + this._m;
		},
		// v = (y - m) / k
		_toValue: function (y) {
			return (y - this._m) / this._k;
		},

		setSteps: function (steps) {
			var sliderHeight = steps * this._stepHeight;
			this._maxValue = steps - 1;

			// conversion parameters
			// the conversion is just a common linear function.
			this._k = -this._stepHeight;
			this._m = sliderHeight - (this._stepHeight + this._knobHeight) / 2;
		},

		setPosition: function (y) {
			EzServerClient.DomUtil.setPosition(this._element,
								  EzServerClient.point(0, this._adjust(y)));
		},

		setValue: function (v) {
			this.setPosition(this._toY(v));
		},

		getValue: function () {
			return this._toValue(EzServerClient.DomUtil.getPosition(this._element).y);
		}
	});

	var Zoomslider = EzServerClient.Control.extend({
		options: {
			position: 'topleft',
			// Height of zoom-slider.png in px
			stepHeight: 9,
			// Height of the knob div in px (including border)
			knobHeight: 16,
			styleNS: 'EzServerClient-control-zoomslider3'
		},

		onAdd: function (map) {
			this._map = map;
			this._ui = this._createUI();
			this._knob = new Knob(this._ui.knob,
								  this.options.stepHeight,
								  this.options.knobHeight);

			map.whenReady(this._initKnob,        this)
				.whenReady(this._initEvents,      this)
				.whenReady(this._updateSize,      this)
				.whenReady(this._updateKnobValue, this)
				.whenReady(this._updateDisabled,  this);
			return this._ui.bar;
		},

		onRemove: function (map) {
			map.off('zoomlevelschange',         this._updateSize,      this)
				.off('zoomend zoomlevelschange', this._updateKnobValue, this)
				.off('zoomend zoomlevelschange', this._updateDisabled,  this);
		},

		_createUI: function () {
			var ui = {},
				ns = this.options.styleNS;

			ui.bar     = EzServerClient.DomUtil.create('div', ns);
			ui.zoomIn  = this._createZoomBtn('in', 'top', ui.bar);
			ui.wrap    = EzServerClient.DomUtil.create('div', ns + '-wrap', ui.bar);
			ui.zoomOut = this._createZoomBtn('out', 'bottom', ui.bar);
			ui.body    = EzServerClient.DomUtil.create('div', ns + '-body', ui.wrap);
			ui.knobSt  = EzServerClient.DomUtil.create('div', ns + '-knobSteps', ui.wrap);
			ui.knob    = EzServerClient.DomUtil.create('div', ns + '-knob');

			EzServerClient.DomEvent.disableClickPropagation(ui.bar);
			EzServerClient.DomEvent.disableClickPropagation(ui.knob);

			return ui;
		},
		_createZoomBtn: function (zoomDir, end, container) {
			var classDef = this.options.styleNS + '-' + zoomDir,
				link = EzServerClient.DomUtil.create('a', classDef, container);

			link.href = '#';
			link.title = 'Zoom ' + zoomDir;

			EzServerClient.DomEvent.on(link, 'click', EzServerClient.DomEvent.preventDefault);

			return link;
		},

		_initKnob: function () {
			this._knob.enable();
			this._ui.body.appendChild(this._ui.knob);
		},
		_initEvents: function () {
			this._map
				.on('zoomlevelschange',         this._updateSize,      this)
				.on('zoomend zoomlevelschange', this._updateKnobValue, this)
				.on('zoomend zoomlevelschange', this._updateDisabled,  this);

			EzServerClient.DomEvent.on(this._ui.body,    'click', this._onSliderClick, this);
			EzServerClient.DomEvent.on(this._ui.zoomIn,  'click', this._zoomIn,        this);
			EzServerClient.DomEvent.on(this._ui.zoomOut, 'click', this._zoomOut,       this);

			this._knob.on('dragend', this._updateMapZoom, this);
			//this._knob.on('drag',this._updateDom,this);
		},

		_onSliderClick: function (e) {
			if (e.target === this._knob._element) {return;}
			var first = (e.touches && e.touches.length === 1 ? e.touches[0] : e),
				y = EzServerClient.DomEvent.getMousePosition(first, this._ui.body).y;

			this._knob.setPosition(y);
			this._updateMapZoom();
		},

		_updateDom:function(e){
			if (!e) {
				this._ui.body.style.height = this._knob._toY(this._toValue(this._map.getZoom())) + 'px';
				this._ui.knobSt.style.height = this._knob._m - this._knob._toY(this._toValue(this._map.getZoom())) + 'px';
			}
			else{
				if (e.target instanceof EzServerClient.Draggable) {
					var obj = e.target,
						y_value = obj._newPos.y;
					this._ui.body.style.height = y_value + 'px';
					this._ui.knobSt.style.height = this._knob._m - y_value + 'px';
				}
			}
		},
		
		_zoomIn: function (e) {
			this._map.zoomIn(e.shiftKey ? 3 : 1);
		},
		_zoomOut: function (e) {
			this._map.zoomOut(e.shiftKey ? 3 : 1);
		},

		_zoomLevels: function () {
			var zoomLevels = this._map.getMaxZoom() - this._map.getMinZoom() + 1;
			return zoomLevels < Infinity ? zoomLevels : 0;
		},
		_toZoomLevel: function (value) {
			return value + this._map.getMinZoom();
		},
		_toValue: function (zoomLevel) {
			return zoomLevel - this._map.getMinZoom();
		},

		_updateSize: function () {
			var steps = this._zoomLevels();
			
			this._ui.body.style.height = this.options.stepHeight * steps + 'px';
			this._knob.setSteps(steps);
			//this._updateDom();
		},
		_updateMapZoom: function () {
			this._map.setZoom(this._toZoomLevel(this._knob.getValue()));
		},
		_updateKnobValue: function () {
			this._knob.setValue(this._toValue(this._map.getZoom()));
		},
		_updateDisabled: function () {
			var zoomLevel = this._map.getZoom(),
				className = this.options.styleNS + '-disabled';

			EzServerClient.DomUtil.removeClass(this._ui.zoomIn,  className);
			EzServerClient.DomUtil.removeClass(this._ui.zoomOut, className);

			if (zoomLevel === this._map.getMinZoom()) {
				EzServerClient.DomUtil.addClass(this._ui.zoomOut, className);
			}
			if (zoomLevel === this._map.getMaxZoom()) {
				EzServerClient.DomUtil.addClass(this._ui.zoomIn, className);
			}
		}
	});

	return Zoomslider;
})();

EzServerClient.Map.addInitHook(function () {
	if (this.options.zoomsliderControl) {
		this.zoomsliderControl = new EzServerClient.Control.ZoomsliderForAnhui();
		this.addControl(this.zoomsliderControl);
	}
});

EzServerClient.control.zoomsliderForAnhui = function (options) {
	return new EzServerClient.Control.ZoomsliderForAnhui(options);
};


EzServerClient.Control.ZoomsliderForAnhui2 = EzServerClient.Control.extend({
	options: {
		collapsed: true,
		position: 'topleft',
		// height in px of zoom-slider.png
		stepHeight: 9
	},

	onAdd: function(map) {
		var className = 'leaflet-control-zoomslider',
			container = EzServerClient.DomUtil.create('div', className);

		EzServerClient.DomEvent.disableClickPropagation(container);

		this._map = map;

		this._zoomInButton = this._createButton('Zoom in', className + '-in', container, this._zoomIn, this);
		this._createSlider(className + '-slider', container, map);
		this._zoomOutButton = this._createButton('Zoom out', className + '-out', container, this._zoomOut, this);

		// map.on('layeradd', this._refresh, this);
		/**
		 * @author [qianleyi]
		 * @description [绑定事件使得累加_refresh（）导致内存泄露]
		 */
		map.addOneTimeEventListener('layeradd layerremove', this._refresh, this);

		map.whenReady(function() {
			this._snapToSliderValue();
			map.on('zoomend', this._snapToSliderValue, this);
			// map.on('zoomstart',this._expand,this);
			// map.on('zoomend',this._collapse,this);
		}, this);

		return container;
	},

	onRemove: function(map) {
		map.off('zoomend', this._snapToSliderValue);
		map.off('layeradd layerremove', this._refresh);
	},

	_refresh: function() {
		this._map
			.removeControl(this)
			.addControl(this);
	},

	_createSlider: function(className, container, map) {
		var zoomLevels = map.getMaxZoom() - map.getMinZoom();
		// This means we have no tilelayers (or that they are setup in a strange way).
		// Either way we don't want to add a slider here.
		if (zoomLevels == Infinity) {
			return undefined;
		}
		this._sliderHeight = this.options.stepHeight * zoomLevels;

		var wrapper = EzServerClient.DomUtil.create('div', className + '-wrap', container);
		wrapper.style.height = (this._sliderHeight + 5) + "px";
		var slider = EzServerClient.DomUtil.create('div', className, wrapper);
		// slider.setAttribute('aria-haspopup', true);

		this._knobset = EzServerClient.DomUtil.create('div', className + '-knobset', slider);

		this._knob = EzServerClient.DomUtil.create('div', className + '-knob', this._knobset);


		if (this.options.collapsed) {
			EzServerClient.DomEvent.on(slider, 'mouseover', this._expand, this);
			EzServerClient.DomEvent.on(slider, 'mouseout', this._collapse, this);

			this._knobTip = EzServerClient.DomUtil.create('div', className + '-knobTip', this._knobset);
		 // this._knoba = EzServerClient.DomUtil.create('a', className + '-knobTip-a', this._knobTip);

			this._collapse();
		} else {
			this._expand();
		}

		// EzServerClient.DomEvent.on(this._map._container, 'mousewheel', this._onWheelScroll, this);


		this._draggable = this._createDraggable();
		this._draggable.enable();

		EzServerClient.DomEvent.on(slider, 'click', this._onSliderClick, this);

		return slider;
	},

	_zoomIn: function(e) {
		this._map.zoomIn(e.shiftKey ? 3 : 1);
	},

	_zoomOut: function(e) {
		this._map.zoomOut(e.shiftKey ? 3 : 1);
	},

	_createButton: function(title, className, container, fn, context) {
		var link = EzServerClient.DomUtil.create('a', className, container);
		link.href = '#';
		link.title = title;

		EzServerClient.DomEvent
			.on(link, 'click', EzServerClient.DomEvent.preventDefault)
			.on(link, 'click', fn, context);

		return link;
	},

	_createDraggable: function() {
		EzServerClient.DomUtil.setPosition(this._knob, EzServerClient.point(0, 0));
		EzServerClient.DomEvent.disableClickPropagation(this._knob);

		var bounds = new EzServerClient.Bounds(
			EzServerClient.point(0, 0),
			EzServerClient.point(0, this._sliderHeight)
		);
		var draggable = new EzServerClient.BoundedDraggable(this._knob,
				this._knob,
				bounds)
			.on('drag', this._snap, this)
			.on('dragend', this._setZoom, this);

		return draggable;
	},

	_snap: function() {
		this._snapToSliderValue(this._posToSliderValue());
	},
	_setZoom: function() {
		this._map.setZoom(this._toZoomLevel(this._posToSliderValue()));
	},

	_onSliderClick: function(e) {
		var first = (e.touches && e.touches.length === 1 ? e.touches[0] : e);
		var offset = first.offsetY ? first.offsetY : EzServerClient.DomEvent.getMousePosition(first).y - EzServerClient.DomUtil.getViewportOffset(this._knob).y;
		var value = this._posToSliderValue(offset - this._knob.offsetHeight / 2);
		this._snapToSliderValue(value);
		this._map.setZoom(this._toZoomLevel(value));
	},

	_posToSliderValue: function(pos) {
		pos = isNaN(pos) ? EzServerClient.DomUtil.getPosition(this._knob).y : pos;
		return Math.round((this._sliderHeight - pos) / this.options.stepHeight);
	},

	_snapToSliderValue: function(sliderValue) {
		this._updateDisabled();
		if (this._knob) {
			sliderValue = isNaN(sliderValue) ? this._getSliderValue() : sliderValue;
			var y = this._sliderHeight - (sliderValue * this.options.stepHeight);
			EzServerClient.DomUtil.setPosition(this._knob, EzServerClient.point(0, y));
		}
		if (this._knobTip) {
			sliderValue = isNaN(sliderValue) ? this._getSliderValue() : sliderValue;
			var y = this._sliderHeight - (sliderValue * this.options.stepHeight);
			EzServerClient.DomUtil.setPosition(this._knobTip, EzServerClient.point(0, y));
			this._knoba;
		}
	},
	_toZoomLevel: function(sliderValue) {
		return sliderValue + this._map.getMinZoom();
	},
	_toSliderValue: function(zoomLevel) {
		return zoomLevel - this._map.getMinZoom();
	},
	_getSliderValue: function() {
		return this._toSliderValue(this._map.getZoom());
	},

	_expand: function() {
		if (this._knobTip.className === '') {
			this._knobTip.className = this._knobTip.className.replace('', 'leaflet-control-zoomslider-slider-knobTip');
		}
		this._showZoomLevel();
	},

	_collapse: function() {
		if (this._knobTip.className != '') {
			this._knobTip.className = this._knobTip.className.replace('leaflet-control-zoomslider-slider-knobTip', '');
		}
		this._knobTip.innerHTML = '';
	},

	_showZoomLevel:function(){
		this._knobTip.innerHTML = this._map._zoom;
	},

	_updateDisabled: function() {
		var map = this._map,
			className = 'leaflet-control-zoomslider-disabled';

		EzServerClient.DomUtil.removeClass(this._zoomInButton, className);
		EzServerClient.DomUtil.removeClass(this._zoomOutButton, className);

		if (map.getZoom() === map.getMinZoom()) {
			EzServerClient.DomUtil.addClass(this._zoomOutButton, className);
		}
		if (map.getZoom() === map.getMaxZoom()) {
			EzServerClient.DomUtil.addClass(this._zoomInButton, className);
		}
	}
});

EzServerClient.Map.mergeOptions({
	zoomControl: false,
	zoomsliderControl: true
});

// EzServerClient.Map.addInitHook(function() {
// 	if (this.options.zoomsliderControl) {
// 		this.zoomsliderControl=EzServerClient.control.zoomslider().addTo(this);
// 	}
// });

EzServerClient.control.zoomsliderForAnhui2 = function(options) {
	return new EzServerClient.Control.ZoomsliderForAnhui2(options);
};


EzServerClient.BoundedDraggable = EzServerClient.Draggable.extend({
	initialize: function(element, dragStartTarget, bounds) {
		EzServerClient.Draggable.prototype.initialize.call(this, element, dragStartTarget);
		this._bounds = bounds;
		this.on('predrag', function() {
			if (!this._bounds.contains(this._newPos)) {
				this._newPos = this._fitPoint(this._newPos);
			}
		}, this);
	},
	_fitPoint: function(point) {
		var closest = EzServerClient.point(
			Math.min(point.x, this._bounds.max.x),
			Math.min(point.y, this._bounds.max.y)
		);
		closest.x = Math.max(closest.x, this._bounds.min.x);
		closest.y = Math.max(closest.y, this._bounds.min.y);
		return closest;
	}
});

EzServerClient.Control.MiniMap = EzServerClient.Control.extend({
	options: {
		position: 'bottomright',
		toggleDisplay: true,
		zoomLevelOffset: -5,
		zoomLevelFixed: false,
		zoomAnimation: false,
		autoToggleDisplay: false,
		isEzMap: false,
		width: 150,
		height: 150,
		aimingRectOptions: {color: "#ff7800", weight: 1, clickable: false},
		shadowRectOptions: {color: "#000000", weight: 1, clickable: false, opacity:0, fillOpacity:0}
	},
	
	hideText: 'Hide MiniMap',
	
	showText: 'Show MiniMap',
	
	//layer is the map layer to be shown in the minimap
	initialize: function (layer, options) {
		EzServerClient.Util.setOptions(this, options);
		//Make sure the aiming rects are non-clickable even if the user tries to set them clickable (most likely by forgetting to specify them false)
		this.options.aimingRectOptions.clickable = false;
		this.options.shadowRectOptions.clickable = false;
		this._layer = layer;
	},
	
	onAdd: function (map) {

		this._mainMap = map;

		//Creating the container and stopping events from spilling through to the main map.
		this._container = EzServerClient.DomUtil.create('div', 'leaflet-control-minimap');
		this._container.style.width = this.options.width + 'px';
		this._container.style.height = this.options.height + 'px';
		EzServerClient.DomEvent.disableClickPropagation(this._container);
		EzServerClient.DomEvent.on(this._container, 'mousewheel', EzServerClient.DomEvent.stopPropagation);

		//qianleyi
		//
		// this._layer._container = rhis._container;

		this._miniMap = new EzServerClient.Map(this._container,
		{
			attributionControl: false,
			isEzMap:map.options.isEzMap,
			zoomControl: false,
			zoomsliderControl: false,
			navButtonControl: false,
			zoomAnimation: this.options.zoomAnimation,
			autoToggleDisplay: this.options.autoToggleDisplay,
			touchZoom: !this.options.zoomLevelFixed,
			scrollWheelZoom: !this.options.zoomLevelFixed,
			doubleClickZoom: !this.options.zoomLevelFixed,
			closePopupOnClick : false,
			boxZoom: !this.options.zoomLevelFixed,
			crs: map.options.crs
		});

		this._miniMap.addLayer(this._layer);

		//These bools are used to prevent infinite loops of the two maps notifying each other that they've moved.
		this._mainMapMoving = false;
		this._miniMapMoving = false;

		//Keep a record of this to prevent auto toggling when the user explicitly doesn't want it.
		this._userToggledDisplay = false;
		this._minimized = false;

		if (this.options.toggleDisplay) {
			this._addToggleButton();
		}

		//qianleyi
		//
		// this._miniMap.addOneTimeEventListener('layeradd layerremove',this._refresh,this);

		this._miniMap.whenReady(EzServerClient.Util.bind(function () {
			this._aimingRect = EzServerClient.rectangle(this._mainMap.getBounds(), this.options.aimingRectOptions).addTo(this._miniMap);
			this._shadowRect = EzServerClient.rectangle(this._mainMap.getBounds(), this.options.shadowRectOptions).addTo(this._miniMap);
			this._mainMap.on('moveend', this._onMainMapMoved, this);
			this._mainMap.on('move', this._onMainMapMoving, this);
			this._miniMap.on('movestart', this._onMiniMapMoveStarted, this);
			this._miniMap.on('move', this._onMiniMapMoving, this);
			this._miniMap.on('moveend', this._onMiniMapMoved, this);
			this._mainMap.on('layeradd',this._refresh,this);
		}, this));


		return this._container;
	},

	addTo: function (map) {
		EzServerClient.Control.prototype.addTo.call(this, map);
		this._miniMap.setView(this._mainMap.getCenter(), this._decideZoom(true));
		this._setDisplay(this._decideMinimized());
		return this;
	},

	onRemove: function () {
		this._mainMap.off('moveend', this._onMainMapMoved, this);
		this._mainMap.off('move', this._onMainMapMoving, this);
		this._miniMap.off('moveend', this._onMiniMapMoved, this);
		
		
		this._miniMap.removeLayer(this._layer);
	},


	/**
	 * @author [qianleyi]
	 * [_refresh description]
	 * @return {[type]} [description]
	 * @author qianleyi
	 * @date 2014.9.12
	 * @description minimap是否显示overlay图层？
	 */
	_refresh:function(e){
		if(e.layer._tileContainer){
			this.onRemove();
			this._layer = e.layer.clone();
			this._adjustMapParameter();
			this._miniMap.addLayer(this._layer);
			this._mainMap.on('moveend', this._onMainMapMoved, this);
			this._mainMap.on('move', this._onMainMapMoving, this);
			this._miniMap.on('moveend', this._onMiniMapMoved, this);
		}
		// else if(e.layer._wrapper || e.layer._popup){
		// 	this._adjustMapParameter();
		// }
		else{
			this._adjustMapParameter();
			// this._miniMap.addLayer(e.layer.clone());
		}		
	},

	/**
	 * @author [qianleyi]
	 * [_adjustMapParameter description]
	 * @return {[type]} [description]
	 */
	_adjustMapParameter:function(){
		var tempCenter = this._mainMap.getCenter();
		var tempZoom = this._decideZoom(true);

		if (this._map.options.isEzMap) {
			this._miniMap.options.crs = EzServerClient.CRS.EPSG4326Ez;
			this._miniMap.options.isEzMap = true;
			this._miniMap.setView(tempCenter, tempZoom);
		} else {
			this._miniMap.options.crs = EzServerClient.CRS.EPSG3857;
			this._miniMap.options.isEzMap = false;
			this._miniMap.setView(tempCenter, tempZoom);
		}
	},
	
	_addToggleButton: function () {
		this._toggleDisplayButton = this.options.toggleDisplay ? this._createButton(
		'', this.hideText, 'leaflet-control-minimap-toggle-display', this._container, this._toggleDisplayButtonClicked, this): undefined;
	},

	_createButton: function (html, title, className, container, fn, context) {
		var link = EzServerClient.DomUtil.create('a', className, container);
		link.innerHTML = html;
		link.href = '#';
		link.title = title;

		var stop = EzServerClient.DomEvent.stopPropagation;

		EzServerClient.DomEvent
			.on(link, 'click', stop)
			.on(link, 'mousedown', stop)
			.on(link, 'dblclick', stop)
			.on(link, 'click', EzServerClient.DomEvent.preventDefault)
			.on(link, 'click', fn, context);

		return link;
	},

	_toggleDisplayButtonClicked: function () {
		this._userToggledDisplay = true;
		if (!this._minimized) {
			this._minimize();
			this._toggleDisplayButton.title = this.showText;
		}
		else {
			this._restore();
			this._toggleDisplayButton.title = this.hideText;
		}
	},

	_setDisplay: function (minimize) {
		if (minimize != this._minimized) {
			if (!this._minimized) {
				this._minimize();
			}
			else {
				this._restore();
			}
		}
	},

	_minimize: function () {
		// hide the minimap
		if (this.options.toggleDisplay) {
			this._container.style.width = '19px';
			this._container.style.height = '19px';
			this._toggleDisplayButton.className += ' minimized';
		}
		else {
			this._container.style.display = 'none';
		}
		this._minimized = true;
	},

	_restore: function () {
		if (this.options.toggleDisplay) {
			this._container.style.width = this.options.width + 'px';
			this._container.style.height = this.options.height + 'px';
			this._toggleDisplayButton.className = this._toggleDisplayButton.className
					.replace(/(?:^|\s)minimized(?!\S)/g, '');
		}
		else {
			this._container.style.display = 'block';
		}
		this._minimized = false;
	},

	_onMainMapMoved: function (e) {
		if (!this._miniMapMoving) {
			this._mainMapMoving = true;
			this._miniMap.setView(this._mainMap.getCenter(), this._decideZoom(true));
			this._setDisplay(this._decideMinimized());
		} else {
			this._miniMapMoving = false;
		}
		this._aimingRect.setBounds(this._mainMap.getBounds());
	},

	_onMainMapMoving: function (e) {
		this._aimingRect.setBounds(this._mainMap.getBounds());
	},

	_onMiniMapMoveStarted:function (e) {
		var lastAimingRect = this._aimingRect.getBounds();
		var sw = this._miniMap.latLngToContainerPoint(lastAimingRect.getSouthWest());
		var ne = this._miniMap.latLngToContainerPoint(lastAimingRect.getNorthEast());
		this._lastAimingRectPosition = {sw:sw,ne:ne};
	},

	_onMiniMapMoving: function (e) {
		if (!this._mainMapMoving && this._lastAimingRectPosition) {
			this._shadowRect.setBounds(new EzServerClient.LatLngBounds(this._miniMap.containerPointToLatLng(this._lastAimingRectPosition.sw),this._miniMap.containerPointToLatLng(this._lastAimingRectPosition.ne)));
			this._shadowRect.setStyle({opacity:1,fillOpacity:0.3});
		}
	},

	_onMiniMapMoved: function (e) {
		if (!this._mainMapMoving) {
			this._miniMapMoving = true;
			this._mainMap.setView(this._miniMap.getCenter(), this._decideZoom(false));
			this._shadowRect.setStyle({opacity:0,fillOpacity:0});
		} else {
			this._mainMapMoving = false;
		}
	},

	_decideZoom: function (fromMaintoMini) {
		if (!this.options.zoomLevelFixed) {
			if (fromMaintoMini)
				return this._mainMap.getZoom() + this.options.zoomLevelOffset;
			else {
				var currentDiff = this._miniMap.getZoom() - this._mainMap.getZoom();
				var proposedZoom = this._miniMap.getZoom() - this.options.zoomLevelOffset;
				var toRet;
				
				if (currentDiff > this.options.zoomLevelOffset && this._mainMap.getZoom() < this._miniMap.getMinZoom() - this.options.zoomLevelOffset) {
					//This means the miniMap is zoomed out to the minimum zoom level and can't zoom any more.
					if (this._miniMap.getZoom() > this._lastMiniMapZoom) {
						//This means the user is trying to zoom in by using the minimap, zoom the main map.
						toRet = this._mainMap.getZoom() + 1;
						//Also we cheat and zoom the minimap out again to keep it visually consistent.
						this._miniMap.setZoom(this._miniMap.getZoom() -1);
					} else {
						//Either the user is trying to zoom out past the mini map's min zoom or has just panned using it, we can't tell the difference.
						//Therefore, we ignore it!
						toRet = this._mainMap.getZoom();
					}
				} else {
					//This is what happens in the majority of cases, and always if you configure the min levels + offset in a sane fashion.
					toRet = proposedZoom;
				}
				this._lastMiniMapZoom = this._miniMap.getZoom();
				return toRet;
			}
		} else {
			if (fromMaintoMini)
				return this.options.zoomLevelFixed;
			else
				return this._mainMap.getZoom();
		}
	},

	_decideMinimized: function () {
		if (this._userToggledDisplay) {
			return this._minimized;
		}

		if (this.options.autoToggleDisplay) {
			if (this._mainMap.getBounds().contains(this._miniMap.getBounds())) {
				return true;
			}
			return false;
		}

		return this._minimized;
	}
});

EzServerClient.Map.mergeOptions({
	miniMapControl: false
});

// EzServerClient.Map.addInitHook(function () {
// 	if (this.options.miniMapControl) {
// 		this.miniMapControl = (new EzServerClient.Control.MiniMap()).addTo(this);
// 	}
// });

EzServerClient.control.minimap = function (options) {
	return new EzServerClient.Control.MiniMap(options);
};


/*
 * EzServerClient.PosAnimation is used by Leaflet internally for pan animations.
 */

EzServerClient.PosAnimation = EzServerClient.Class.extend({
	includes: EzServerClient.Mixin.Events,

	run: function (el, newPos, duration, easeLinearity) { // (HTMLElement, Point[, Number, Number])
		this.stop();

		this._el = el;
		this._inProgress = true;
		this._newPos = newPos;

		this.fire('start');

		el.style[EzServerClient.DomUtil.TRANSITION] = 'all ' + (duration || 0.25) +
		        's cubic-bezier(0,0,' + (easeLinearity || 0.5) + ',1)';

		EzServerClient.DomEvent.on(el, EzServerClient.DomUtil.TRANSITION_END, this._onTransitionEnd, this);
		EzServerClient.DomUtil.setPosition(el, newPos);

		// toggle reflow, Chrome flickers for some reason if you don't do this
		EzServerClient.Util.falseFn(el.offsetWidth);

		// there's no native way to track value updates of transitioned properties, so we imitate this
		this._stepTimer = setInterval(EzServerClient.bind(this._onStep, this), 50);
	},

	stop: function () {
		if (!this._inProgress) { return; }

		// if we just removed the transition property, the element would jump to its final position,
		// so we need to make it stay at the current position

		EzServerClient.DomUtil.setPosition(this._el, this._getPos());
		this._onTransitionEnd();
		EzServerClient.Util.falseFn(this._el.offsetWidth); // force reflow in case we are about to start a new animation
	},

	_onStep: function () {
		var stepPos = this._getPos();
		if (!stepPos) {
			this._onTransitionEnd();
			return;
		}
		// jshint camelcase: false
		// make EzServerClient.DomUtil.getPosition return intermediate position value during animation
		this._el._leaflet_pos = stepPos;

		this.fire('step');
	},

	// you can't easily get intermediate values of properties animated with CSS3 Transitions,
	// we need to parse computed style (in case of transform it returns matrix string)

	_transformRe: /([-+]?(?:\d*\.)?\d+)\D*, ([-+]?(?:\d*\.)?\d+)\D*\)/,

	_getPos: function () {
		var left, top, matches,
		    el = this._el,
		    style = window.getComputedStyle(el);

		if (EzServerClient.Browser.any3d) {
			matches = style[EzServerClient.DomUtil.TRANSFORM].match(this._transformRe);
			if (!matches) { return; }
			left = parseFloat(matches[1]);
			top  = parseFloat(matches[2]);
		} else {
			left = parseFloat(style.left);
			top  = parseFloat(style.top);
		}

		return new EzServerClient.Point(left, top, true);
	},

	_onTransitionEnd: function () {
		EzServerClient.DomEvent.off(this._el, EzServerClient.DomUtil.TRANSITION_END, this._onTransitionEnd, this);

		if (!this._inProgress) { return; }
		this._inProgress = false;

		this._el.style[EzServerClient.DomUtil.TRANSITION] = '';

		// jshint camelcase: false
		// make sure EzServerClient.DomUtil.getPosition returns the final position value after animation
		this._el._leaflet_pos = this._newPos;

		clearInterval(this._stepTimer);

		this.fire('step').fire('end');
	}

});


/*
 * Extends EzServerClient.Map to handle panning animations.
 */

EzServerClient.Map.include({

	setView: function (center, zoom, options) {

		zoom = zoom === undefined ? this._zoom : this._limitZoom(zoom);
		center = this._limitCenter(EzServerClient.latLng(center), zoom, this.options.maxBounds);
		options = options || {};

		if (this._panAnim) {
			this._panAnim.stop();
		}

		if (this._loaded && !options.reset && options !== true) {

			if (options.animate !== undefined) {
				options.zoom = EzServerClient.extend({animate: options.animate}, options.zoom);
				options.pan = EzServerClient.extend({animate: options.animate}, options.pan);
			}

			// try animating pan or zoom
			var animated = (this._zoom !== zoom) ?
				this._tryAnimatedZoom && this._tryAnimatedZoom(center, zoom, options.zoom) :
				this._tryAnimatedPan(center, options.pan);

			if (animated) {
				// prevent resize handler call, the view will refresh after animation anyway
				clearTimeout(this._sizeTimer);
				return this;
			}
		}

		// animation didn't start, just reset the map view
		this._resetView(center, zoom);

		return this;
	},

	panBy: function (offset, options) {
		offset = EzServerClient.point(offset).round();
		options = options || {};

		if (!offset.x && !offset.y) {
			return this;
		}

		if (!this._panAnim) {
			this._panAnim = new EzServerClient.PosAnimation();

			this._panAnim.on({
				'step': this._onPanTransitionStep,
				'end': this._onPanTransitionEnd
			}, this);
		}

		// don't fire movestart if animating inertia
		if (!options.noMoveStart) {
			this.fire('movestart');
		}

		// animate pan unless animate: false specified
		if (options.animate !== false) {
			EzServerClient.DomUtil.addClass(this._mapPane, 'leaflet-pan-anim');

			var newPos = this._getMapPanePos().subtract(offset);
			this._panAnim.run(this._mapPane, newPos, options.duration || 0.25, options.easeLinearity);
		} else {
			this._rawPanBy(offset);
			this.fire('move').fire('moveend');
		}

		return this;
	},

	_onPanTransitionStep: function () {
		this.fire('move');
	},

	_onPanTransitionEnd: function () {
		EzServerClient.DomUtil.removeClass(this._mapPane, 'leaflet-pan-anim');
		this.fire('moveend');
	},

	_tryAnimatedPan: function (center, options) {
		// difference between the new and current centers in pixels
		var offset = this._getCenterOffset(center)._floor();

		// don't animate too far unless animate: true specified in options
		if ((options && options.animate) !== true && !this.getSize().contains(offset)) { return false; }

		this.panBy(offset, options);

		return true;
	}
});


/*
 * EzServerClient.PosAnimation fallback implementation that powers Leaflet pan animations
 * in browsers that don't support CSS3 Transitions.
 */

EzServerClient.PosAnimation = EzServerClient.DomUtil.TRANSITION ? EzServerClient.PosAnimation : EzServerClient.PosAnimation.extend({

	run: function (el, newPos, duration, easeLinearity) { // (HTMLElement, Point[, Number, Number])
		this.stop();

		this._el = el;
		this._inProgress = true;
		this._duration = duration || 0.25;
		this._easeOutPower = 1 / Math.max(easeLinearity || 0.5, 0.2);

		this._startPos = EzServerClient.DomUtil.getPosition(el);
		this._offset = newPos.subtract(this._startPos);
		this._startTime = +new Date();

		this.fire('start');

		this._animate();
	},

	stop: function () {
		if (!this._inProgress) { return; }

		this._step();
		this._complete();
	},

	_animate: function () {
		// animation loop
		this._animId = EzServerClient.Util.requestAnimFrame(this._animate, this);
		this._step();
	},

	_step: function () {
		var elapsed = (+new Date()) - this._startTime,
		    duration = this._duration * 1000;

		if (elapsed < duration) {
			this._runFrame(this._easeOut(elapsed / duration));
		} else {
			this._runFrame(1);
			this._complete();
		}
	},

	_runFrame: function (progress) {
		var pos = this._startPos.add(this._offset.multiplyBy(progress));
		EzServerClient.DomUtil.setPosition(this._el, pos);

		this.fire('step');
	},

	_complete: function () {
		EzServerClient.Util.cancelAnimFrame(this._animId);

		this._inProgress = false;
		this.fire('end');
	},

	_easeOut: function (t) {
		return 1 - Math.pow(1 - t, this._easeOutPower);
	}
});


/*
 * Extends EzServerClient.Map to handle zoom animations.
 */

EzServerClient.Map.mergeOptions({
	zoomAnimation: true,
	zoomAnimationThreshold: 4
});

if (EzServerClient.DomUtil.TRANSITION) {

	EzServerClient.Map.addInitHook(function () {
		// don't animate on browsers without hardware-accelerated transitions or old Android/Opera
		this._zoomAnimated = this.options.zoomAnimation && EzServerClient.DomUtil.TRANSITION &&
				EzServerClient.Browser.any3d && !EzServerClient.Browser.android23 && !EzServerClient.Browser.mobileOpera;

		// zoom transitions run with the same duration for all layers, so if one of transitionend events
		// happens after starting zoom animation (propagating to the map pane), we know that it ended globally
		if (this._zoomAnimated) {
			EzServerClient.DomEvent.on(this._mapPane, EzServerClient.DomUtil.TRANSITION_END, this._catchTransitionEnd, this);
		}
	});
}

EzServerClient.Map.include(!EzServerClient.DomUtil.TRANSITION ? {} : {

	_catchTransitionEnd: function (e) {
		if (this._animatingZoom && e.propertyName.indexOf('transform') >= 0) {
			this._onZoomTransitionEnd();
		}
	},

	_nothingToAnimate: function () {
		return !this._container.getElementsByClassName('leaflet-zoom-animated').length;
	},

	_tryAnimatedZoom: function (center, zoom, options) {

		if (this._animatingZoom) { return true; }

		options = options || {};

		// don't animate if disabled, not supported or zoom difference is too large
		if (!this._zoomAnimated || options.animate === false || this._nothingToAnimate() ||
		        Math.abs(zoom - this._zoom) > this.options.zoomAnimationThreshold) { return false; }

		// offset is the pixel coords of the zoom origin relative to the current center
		var scale = this.getZoomScale(zoom),
		    offset = this._getCenterOffset(center)._divideBy(1 - 1 / scale),
			origin = this._getCenterLayerPoint()._add(offset);

		// don't animate if the zoom origin isn't within one screen from the current center, unless forced
		if (options.animate !== true && !this.getSize().contains(offset)) { return false; }

		this
		    .fire('movestart')
		    .fire('zoomstart');

		this._animateZoom(center, zoom, origin, scale, null, true);

		return true;
	},

	_animateZoom: function (center, zoom, origin, scale, delta, backwards, forTouchZoom) {

		if (!forTouchZoom) {
			this._animatingZoom = true;
		}

		// put transform transition on all layers with leaflet-zoom-animated class
		EzServerClient.DomUtil.addClass(this._mapPane, 'leaflet-zoom-anim');

		// remember what center/zoom to set after animation
		this._animateToCenter = center;
		this._animateToZoom = zoom;

		// disable any dragging during animation
		if (EzServerClient.Draggable) {
			EzServerClient.Draggable._disabled = true;
		}

		EzServerClient.Util.requestAnimFrame(function () {
			this.fire('zoomanim', {
				center: center,
				zoom: zoom,
				origin: origin,
				scale: scale,
				delta: delta,
				backwards: backwards
			});
		}, this);
	},

	_onZoomTransitionEnd: function () {

		this._animatingZoom = false;

		EzServerClient.DomUtil.removeClass(this._mapPane, 'leaflet-zoom-anim');

		this._resetView(this._animateToCenter, this._animateToZoom, true, true);

		if (EzServerClient.Draggable) {
			EzServerClient.Draggable._disabled = false;
		}
	}
});


/*
	Zoom animation logic for EzServerClient.TileLayer.
*/

EzServerClient.TileLayer.include({
	_animateZoom: function (e) {
		if (!this._animating) {
			this._animating = true;
			this._prepareBgBuffer();
		}

		var bg = this._bgBuffer,
		    transform = EzServerClient.DomUtil.TRANSFORM,
		    initialTransform = e.delta ? EzServerClient.DomUtil.getTranslateString(e.delta) : bg.style[transform],
		    scaleStr = EzServerClient.DomUtil.getScaleString(e.scale, e.origin);

		bg.style[transform] = e.backwards ?
				scaleStr + ' ' + initialTransform :
				initialTransform + ' ' + scaleStr;
	},

	_endZoomAnim: function () {
		var front = this._tileContainer,
		    bg = this._bgBuffer;

		front.style.visibility = '';
		front.parentNode.appendChild(front); // Bring to fore

		// force reflow
		EzServerClient.Util.falseFn(bg.offsetWidth);

		this._animating = false;
	},

	_clearBgBuffer: function () {
		var map = this._map;

		if (map && !map._animatingZoom && !map.touchZoom._zooming) {
			this._bgBuffer.innerHTML = '';
			this._bgBuffer.style[EzServerClient.DomUtil.TRANSFORM] = '';
		}
	},

	_prepareBgBuffer: function () {

		var front = this._tileContainer,
		    bg = this._bgBuffer;

		// if foreground layer doesn't have many tiles but bg layer does,
		// keep the existing bg layer and just zoom it some more

		var bgLoaded = this._getLoadedTilesPercentage(bg),
		    frontLoaded = this._getLoadedTilesPercentage(front);

		if (bg && bgLoaded > 0.5 && frontLoaded < 0.5) {

			front.style.visibility = 'hidden';
			this._stopLoadingImages(front);
			return;
		}

		// prepare the buffer to become the front tile pane
		bg.style.visibility = 'hidden';
		bg.style[EzServerClient.DomUtil.TRANSFORM] = '';

		// switch out the current layer to be the new bg layer (and vice-versa)
		this._tileContainer = bg;
		bg = this._bgBuffer = front;

		this._stopLoadingImages(bg);

		//prevent bg buffer from clearing right after zoom
		clearTimeout(this._clearBgBufferTimer);
	},

	_getLoadedTilesPercentage: function (container) {
		var tiles = container.getElementsByTagName('img'),
		    i, len, count = 0;

		for (i = 0, len = tiles.length; i < len; i++) {
			if (tiles[i].complete) {
				count++;
			}
		}
		return count / len;
	},

	// stops loading all tiles in the background layer
	_stopLoadingImages: function (container) {
		var tiles = Array.prototype.slice.call(container.getElementsByTagName('img')),
		    i, len, tile;

		for (i = 0, len = tiles.length; i < len; i++) {
			tile = tiles[i];

			if (!tile.complete) {
				tile.onload = EzServerClient.Util.falseFn;
				tile.onerror = EzServerClient.Util.falseFn;
				tile.src = EzServerClient.Util.emptyImageUrl;

				tile.parentNode.removeChild(tile);
			}
		}
	}
});


/*
 * Provides EzServerClient.Map with convenient shortcuts for using browser geolocation features.
 */

EzServerClient.Map.include({
	_defaultLocateOptions: {
		watch: false,
		setView: false,
		maxZoom: Infinity,
		timeout: 10000,
		maximumAge: 0,
		enableHighAccuracy: false
	},

	locate: function (/*Object*/ options) {

		options = this._locateOptions = EzServerClient.extend(this._defaultLocateOptions, options);

		if (!navigator.geolocation) {
			this._handleGeolocationError({
				code: 0,
				message: 'Geolocation not supported.'
			});
			return this;
		}

		var onResponse = EzServerClient.bind(this._handleGeolocationResponse, this),
			onError = EzServerClient.bind(this._handleGeolocationError, this);

		if (options.watch) {
			this._locationWatchId =
			        navigator.geolocation.watchPosition(onResponse, onError, options);
		} else {
			navigator.geolocation.getCurrentPosition(onResponse, onError, options);
		}
		return this;
	},

	stopLocate: function () {
		if (navigator.geolocation) {
			navigator.geolocation.clearWatch(this._locationWatchId);
		}
		if (this._locateOptions) {
			this._locateOptions.setView = false;
		}
		return this;
	},

	_handleGeolocationError: function (error) {
		var c = error.code,
		    message = error.message ||
		            (c === 1 ? 'permission denied' :
		            (c === 2 ? 'position unavailable' : 'timeout'));

		if (this._locateOptions.setView && !this._loaded) {
			this.fitWorld();
		}

		this.fire('locationerror', {
			code: c,
			message: 'Geolocation error: ' + message + '.'
		});
	},

	_handleGeolocationResponse: function (pos) {
		var lat = pos.coords.latitude,
		    lng = pos.coords.longitude,
		    latlng = new EzServerClient.LatLng(lat, lng),

		    latAccuracy = 180 * pos.coords.accuracy / 40075017,
		    lngAccuracy = latAccuracy / Math.cos(EzServerClient.LatLng.DEG_TO_RAD * lat),

		    bounds = EzServerClient.latLngBounds(
		            [lat - latAccuracy, lng - lngAccuracy],
		            [lat + latAccuracy, lng + lngAccuracy]),

		    options = this._locateOptions;

		if (options.setView) {
			var zoom = Math.min(this.getBoundsZoom(bounds), options.maxZoom);
			this.setView(latlng, zoom);
		}

		var data = {
			latlng: latlng,
			bounds: bounds,
			timestamp: pos.timestamp
		};

		for (var i in pos.coords) {
			if (typeof pos.coords[i] === 'number') {
				data[i] = pos.coords[i];
			}
		}

		this.fire('locationfound', data);
	}
});


}(window, document));
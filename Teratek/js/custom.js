/*!
 * jQuery Migrate - v1.4.1 - 2016-05-19
 * Copyright jQuery Foundation and other contributors
 */
(function( jQuery, window, undefined ) {
// See http://bugs.jquery.com/ticket/13335
// "use strict";


jQuery.migrateVersion = "1.4.1";


var warnedAbout = {};

// List of warnings already given; public read only
jQuery.migrateWarnings = [];

// Set to true to prevent console output; migrateWarnings still maintained
// jQuery.migrateMute = false;

// Show a message on the console so devs know we're active
if ( window.console && window.console.log ) {
	window.console.log( "JQMIGRATE: Migrate is installed" +
		( jQuery.migrateMute ? "" : " with logging active" ) +
		", version " + jQuery.migrateVersion );
}

// Set to false to disable traces that appear with warnings
if ( jQuery.migrateTrace === undefined ) {
	jQuery.migrateTrace = true;
}

// Forget any warnings we've already given; public
jQuery.migrateReset = function() {
	warnedAbout = {};
	jQuery.migrateWarnings.length = 0;
};

function migrateWarn( msg) {
	var console = window.console;
	if ( !warnedAbout[ msg ] ) {
		warnedAbout[ msg ] = true;
		jQuery.migrateWarnings.push( msg );
		if ( console && console.warn && !jQuery.migrateMute ) {
			console.warn( "JQMIGRATE: " + msg );
			if ( jQuery.migrateTrace && console.trace ) {
				console.trace();
			}
		}
	}
}

function migrateWarnProp( obj, prop, value, msg ) {
	if ( Object.defineProperty ) {
		// On ES5 browsers (non-oldIE), warn if the code tries to get prop;
		// allow property to be overwritten in case some other plugin wants it
		try {
			Object.defineProperty( obj, prop, {
				configurable: true,
				enumerable: true,
				get: function() {
					migrateWarn( msg );
					return value;
				},
				set: function( newValue ) {
					migrateWarn( msg );
					value = newValue;
				}
			});
			return;
		} catch( err ) {
			// IE8 is a dope about Object.defineProperty, can't warn there
		}
	}

	// Non-ES5 (or broken) browser; just set the property
	jQuery._definePropertyBroken = true;
	obj[ prop ] = value;
}

if ( document.compatMode === "BackCompat" ) {
	// jQuery has never supported or tested Quirks Mode
	migrateWarn( "jQuery is not compatible with Quirks Mode" );
}


var attrFn = jQuery( "<input/>", { size: 1 } ).attr("size") && jQuery.attrFn,
	oldAttr = jQuery.attr,
	valueAttrGet = jQuery.attrHooks.value && jQuery.attrHooks.value.get ||
		function() { return null; },
	valueAttrSet = jQuery.attrHooks.value && jQuery.attrHooks.value.set ||
		function() { return undefined; },
	rnoType = /^(?:input|button)$/i,
	rnoAttrNodeType = /^[238]$/,
	rboolean = /^(?:autofocus|autoplay|async|checked|controls|defer|disabled|hidden|loop|multiple|open|readonly|required|scoped|selected)$/i,
	ruseDefault = /^(?:checked|selected)$/i;

// jQuery.attrFn
migrateWarnProp( jQuery, "attrFn", attrFn || {}, "jQuery.attrFn is deprecated" );

jQuery.attr = function( elem, name, value, pass ) {
	var lowerName = name.toLowerCase(),
		nType = elem && elem.nodeType;

	if ( pass ) {
		// Since pass is used internally, we only warn for new jQuery
		// versions where there isn't a pass arg in the formal params
		if ( oldAttr.length < 4 ) {
			migrateWarn("jQuery.fn.attr( props, pass ) is deprecated");
		}
		if ( elem && !rnoAttrNodeType.test( nType ) &&
			(attrFn ? name in attrFn : jQuery.isFunction(jQuery.fn[name])) ) {
			return jQuery( elem )[ name ]( value );
		}
	}

	// Warn if user tries to set `type`, since it breaks on IE 6/7/8; by checking
	// for disconnected elements we don't warn on $( "<button>", { type: "button" } ).
	if ( name === "type" && value !== undefined && rnoType.test( elem.nodeName ) && elem.parentNode ) {
		migrateWarn("Can't change the 'type' of an input or button in IE 6/7/8");
	}

	// Restore boolHook for boolean property/attribute synchronization
	if ( !jQuery.attrHooks[ lowerName ] && rboolean.test( lowerName ) ) {
		jQuery.attrHooks[ lowerName ] = {
			get: function( elem, name ) {
				// Align boolean attributes with corresponding properties
				// Fall back to attribute presence where some booleans are not supported
				var attrNode,
					property = jQuery.prop( elem, name );
				return property === true || typeof property !== "boolean" &&
					( attrNode = elem.getAttributeNode(name) ) && attrNode.nodeValue !== false ?

					name.toLowerCase() :
					undefined;
			},
			set: function( elem, value, name ) {
				var propName;
				if ( value === false ) {
					// Remove boolean attributes when set to false
					jQuery.removeAttr( elem, name );
				} else {
					// value is true since we know at this point it's type boolean and not false
					// Set boolean attributes to the same name and set the DOM property
					propName = jQuery.propFix[ name ] || name;
					if ( propName in elem ) {
						// Only set the IDL specifically if it already exists on the element
						elem[ propName ] = true;
					}

					elem.setAttribute( name, name.toLowerCase() );
				}
				return name;
			}
		};

		// Warn only for attributes that can remain distinct from their properties post-1.9
		if ( ruseDefault.test( lowerName ) ) {
			migrateWarn( "jQuery.fn.attr('" + lowerName + "') might use property instead of attribute" );
		}
	}

	return oldAttr.call( jQuery, elem, name, value );
};

// attrHooks: value
jQuery.attrHooks.value = {
	get: function( elem, name ) {
		var nodeName = ( elem.nodeName || "" ).toLowerCase();
		if ( nodeName === "button" ) {
			return valueAttrGet.apply( this, arguments );
		}
		if ( nodeName !== "input" && nodeName !== "option" ) {
			migrateWarn("jQuery.fn.attr('value') no longer gets properties");
		}
		return name in elem ?
			elem.value :
			null;
	},
	set: function( elem, value ) {
		var nodeName = ( elem.nodeName || "" ).toLowerCase();
		if ( nodeName === "button" ) {
			return valueAttrSet.apply( this, arguments );
		}
		if ( nodeName !== "input" && nodeName !== "option" ) {
			migrateWarn("jQuery.fn.attr('value', val) no longer sets properties");
		}
		// Does not return so that setAttribute is also used
		elem.value = value;
	}
};


var matched, browser,
	oldInit = jQuery.fn.init,
	oldFind = jQuery.find,
	oldParseJSON = jQuery.parseJSON,
	rspaceAngle = /^\s*</,
	rattrHashTest = /\[(\s*[-\w]+\s*)([~|^$*]?=)\s*([-\w#]*?#[-\w#]*)\s*\]/,
	rattrHashGlob = /\[(\s*[-\w]+\s*)([~|^$*]?=)\s*([-\w#]*?#[-\w#]*)\s*\]/g,
	// Note: XSS check is done below after string is trimmed
	rquickExpr = /^([^<]*)(<[\w\W]+>)([^>]*)$/;

// $(html) "looks like html" rule change
jQuery.fn.init = function( selector, context, rootjQuery ) {
	var match, ret;

	if ( selector && typeof selector === "string" ) {
		if ( !jQuery.isPlainObject( context ) &&
				(match = rquickExpr.exec( jQuery.trim( selector ) )) && match[ 0 ] ) {

			// This is an HTML string according to the "old" rules; is it still?
			if ( !rspaceAngle.test( selector ) ) {
				migrateWarn("$(html) HTML strings must start with '<' character");
			}
			if ( match[ 3 ] ) {
				migrateWarn("$(html) HTML text after last tag is ignored");
			}

			// Consistently reject any HTML-like string starting with a hash (gh-9521)
			// Note that this may break jQuery 1.6.x code that otherwise would work.
			if ( match[ 0 ].charAt( 0 ) === "#" ) {
				migrateWarn("HTML string cannot start with a '#' character");
				jQuery.error("JQMIGRATE: Invalid selector string (XSS)");
			}

			// Now process using loose rules; let pre-1.8 play too
			// Is this a jQuery context? parseHTML expects a DOM element (#178)
			if ( context && context.context && context.context.nodeType ) {
				context = context.context;
			}

			if ( jQuery.parseHTML ) {
				return oldInit.call( this,
						jQuery.parseHTML( match[ 2 ], context && context.ownerDocument ||
							context || document, true ), context, rootjQuery );
			}
		}
	}

	ret = oldInit.apply( this, arguments );

	// Fill in selector and context properties so .live() works
	if ( selector && selector.selector !== undefined ) {
		// A jQuery object, copy its properties
		ret.selector = selector.selector;
		ret.context = selector.context;

	} else {
		ret.selector = typeof selector === "string" ? selector : "";
		if ( selector ) {
			ret.context = selector.nodeType? selector : context || document;
		}
	}

	return ret;
};
jQuery.fn.init.prototype = jQuery.fn;

jQuery.find = function( selector ) {
	var args = Array.prototype.slice.call( arguments );

	// Support: PhantomJS 1.x
	// String#match fails to match when used with a //g RegExp, only on some strings
	if ( typeof selector === "string" && rattrHashTest.test( selector ) ) {

		// The nonstandard and undocumented unquoted-hash was removed in jQuery 1.12.0
		// First see if qS thinks it's a valid selector, if so avoid a false positive
		try {
			document.querySelector( selector );
		} catch ( err1 ) {

			// Didn't *look* valid to qSA, warn and try quoting what we think is the value
			selector = selector.replace( rattrHashGlob, function( _, attr, op, value ) {
				return "[" + attr + op + "\"" + value + "\"]";
			} );

			// If the regexp *may* have created an invalid selector, don't update it
			// Note that there may be false alarms if selector uses jQuery extensions
			try {
				document.querySelector( selector );
				migrateWarn( "Attribute selector with '#' must be quoted: " + args[ 0 ] );
				args[ 0 ] = selector;
			} catch ( err2 ) {
				migrateWarn( "Attribute selector with '#' was not fixed: " + args[ 0 ] );
			}
		}
	}

	return oldFind.apply( this, args );
};

// Copy properties attached to original jQuery.find method (e.g. .attr, .isXML)
var findProp;
for ( findProp in oldFind ) {
	if ( Object.prototype.hasOwnProperty.call( oldFind, findProp ) ) {
		jQuery.find[ findProp ] = oldFind[ findProp ];
	}
}

// Let $.parseJSON(falsy_value) return null
jQuery.parseJSON = function( json ) {
	if ( !json ) {
		migrateWarn("jQuery.parseJSON requires a valid JSON string");
		return null;
	}
	return oldParseJSON.apply( this, arguments );
};

jQuery.uaMatch = function( ua ) {
	ua = ua.toLowerCase();

	var match = /(chrome)[ \/]([\w.]+)/.exec( ua ) ||
		/(webkit)[ \/]([\w.]+)/.exec( ua ) ||
		/(opera)(?:.*version|)[ \/]([\w.]+)/.exec( ua ) ||
		/(msie) ([\w.]+)/.exec( ua ) ||
		ua.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec( ua ) ||
		[];

	return {
		browser: match[ 1 ] || "",
		version: match[ 2 ] || "0"
	};
};

// Don't clobber any existing jQuery.browser in case it's different
if ( !jQuery.browser ) {
	matched = jQuery.uaMatch( navigator.userAgent );
	browser = {};

	if ( matched.browser ) {
		browser[ matched.browser ] = true;
		browser.version = matched.version;
	}

	// Chrome is Webkit, but Webkit is also Safari.
	if ( browser.chrome ) {
		browser.webkit = true;
	} else if ( browser.webkit ) {
		browser.safari = true;
	}

	jQuery.browser = browser;
}

// Warn if the code tries to get jQuery.browser
migrateWarnProp( jQuery, "browser", jQuery.browser, "jQuery.browser is deprecated" );

// jQuery.boxModel deprecated in 1.3, jQuery.support.boxModel deprecated in 1.7
jQuery.boxModel = jQuery.support.boxModel = (document.compatMode === "CSS1Compat");
migrateWarnProp( jQuery, "boxModel", jQuery.boxModel, "jQuery.boxModel is deprecated" );
migrateWarnProp( jQuery.support, "boxModel", jQuery.support.boxModel, "jQuery.support.boxModel is deprecated" );

jQuery.sub = function() {
	function jQuerySub( selector, context ) {
		return new jQuerySub.fn.init( selector, context );
	}
	jQuery.extend( true, jQuerySub, this );
	jQuerySub.superclass = this;
	jQuerySub.fn = jQuerySub.prototype = this();
	jQuerySub.fn.constructor = jQuerySub;
	jQuerySub.sub = this.sub;
	jQuerySub.fn.init = function init( selector, context ) {
		var instance = jQuery.fn.init.call( this, selector, context, rootjQuerySub );
		return instance instanceof jQuerySub ?
			instance :
			jQuerySub( instance );
	};
	jQuerySub.fn.init.prototype = jQuerySub.fn;
	var rootjQuerySub = jQuerySub(document);
	migrateWarn( "jQuery.sub() is deprecated" );
	return jQuerySub;
};

// The number of elements contained in the matched element set
jQuery.fn.size = function() {
	migrateWarn( "jQuery.fn.size() is deprecated; use the .length property" );
	return this.length;
};


var internalSwapCall = false;

// If this version of jQuery has .swap(), don't false-alarm on internal uses
if ( jQuery.swap ) {
	jQuery.each( [ "height", "width", "reliableMarginRight" ], function( _, name ) {
		var oldHook = jQuery.cssHooks[ name ] && jQuery.cssHooks[ name ].get;

		if ( oldHook ) {
			jQuery.cssHooks[ name ].get = function() {
				var ret;

				internalSwapCall = true;
				ret = oldHook.apply( this, arguments );
				internalSwapCall = false;
				return ret;
			};
		}
	});
}

jQuery.swap = function( elem, options, callback, args ) {
	var ret, name,
		old = {};

	if ( !internalSwapCall ) {
		migrateWarn( "jQuery.swap() is undocumented and deprecated" );
	}

	// Remember the old values, and insert the new ones
	for ( name in options ) {
		old[ name ] = elem.style[ name ];
		elem.style[ name ] = options[ name ];
	}

	ret = callback.apply( elem, args || [] );

	// Revert the old values
	for ( name in options ) {
		elem.style[ name ] = old[ name ];
	}

	return ret;
};


// Ensure that $.ajax gets the new parseJSON defined in core.js
jQuery.ajaxSetup({
	converters: {
		"text json": jQuery.parseJSON
	}
});


var oldFnData = jQuery.fn.data;

jQuery.fn.data = function( name ) {
	var ret, evt,
		elem = this[0];

	// Handles 1.7 which has this behavior and 1.8 which doesn't
	if ( elem && name === "events" && arguments.length === 1 ) {
		ret = jQuery.data( elem, name );
		evt = jQuery._data( elem, name );
		if ( ( ret === undefined || ret === evt ) && evt !== undefined ) {
			migrateWarn("Use of jQuery.fn.data('events') is deprecated");
			return evt;
		}
	}
	return oldFnData.apply( this, arguments );
};


var rscriptType = /\/(java|ecma)script/i;

// Since jQuery.clean is used internally on older versions, we only shim if it's missing
if ( !jQuery.clean ) {
	jQuery.clean = function( elems, context, fragment, scripts ) {
		// Set context per 1.8 logic
		context = context || document;
		context = !context.nodeType && context[0] || context;
		context = context.ownerDocument || context;

		migrateWarn("jQuery.clean() is deprecated");

		var i, elem, handleScript, jsTags,
			ret = [];

		jQuery.merge( ret, jQuery.buildFragment( elems, context ).childNodes );

		// Complex logic lifted directly from jQuery 1.8
		if ( fragment ) {
			// Special handling of each script element
			handleScript = function( elem ) {
				// Check if we consider it executable
				if ( !elem.type || rscriptType.test( elem.type ) ) {
					// Detach the script and store it in the scripts array (if provided) or the fragment
					// Return truthy to indicate that it has been handled
					return scripts ?
						scripts.push( elem.parentNode ? elem.parentNode.removeChild( elem ) : elem ) :
						fragment.appendChild( elem );
				}
			};

			for ( i = 0; (elem = ret[i]) != null; i++ ) {
				// Check if we're done after handling an executable script
				if ( !( jQuery.nodeName( elem, "script" ) && handleScript( elem ) ) ) {
					// Append to fragment and handle embedded scripts
					fragment.appendChild( elem );
					if ( typeof elem.getElementsByTagName !== "undefined" ) {
						// handleScript alters the DOM, so use jQuery.merge to ensure snapshot iteration
						jsTags = jQuery.grep( jQuery.merge( [], elem.getElementsByTagName("script") ), handleScript );

						// Splice the scripts into ret after their former ancestor and advance our index beyond them
						ret.splice.apply( ret, [i + 1, 0].concat( jsTags ) );
						i += jsTags.length;
					}
				}
			}
		}

		return ret;
	};
}

var eventAdd = jQuery.event.add,
	eventRemove = jQuery.event.remove,
	eventTrigger = jQuery.event.trigger,
	oldToggle = jQuery.fn.toggle,
	oldLive = jQuery.fn.live,
	oldDie = jQuery.fn.die,
	oldLoad = jQuery.fn.load,
	ajaxEvents = "ajaxStart|ajaxStop|ajaxSend|ajaxComplete|ajaxError|ajaxSuccess",
	rajaxEvent = new RegExp( "\\b(?:" + ajaxEvents + ")\\b" ),
	rhoverHack = /(?:^|\s)hover(\.\S+|)\b/,
	hoverHack = function( events ) {
		if ( typeof( events ) !== "string" || jQuery.event.special.hover ) {
			return events;
		}
		if ( rhoverHack.test( events ) ) {
			migrateWarn("'hover' pseudo-event is deprecated, use 'mouseenter mouseleave'");
		}
		return events && events.replace( rhoverHack, "mouseenter$1 mouseleave$1" );
	};

// Event props removed in 1.9, put them back if needed; no practical way to warn them
if ( jQuery.event.props && jQuery.event.props[ 0 ] !== "attrChange" ) {
	jQuery.event.props.unshift( "attrChange", "attrName", "relatedNode", "srcElement" );
}

// Undocumented jQuery.event.handle was "deprecated" in jQuery 1.7
if ( jQuery.event.dispatch ) {
	migrateWarnProp( jQuery.event, "handle", jQuery.event.dispatch, "jQuery.event.handle is undocumented and deprecated" );
}

// Support for 'hover' pseudo-event and ajax event warnings
jQuery.event.add = function( elem, types, handler, data, selector ){
	if ( elem !== document && rajaxEvent.test( types ) ) {
		migrateWarn( "AJAX events should be attached to document: " + types );
	}
	eventAdd.call( this, elem, hoverHack( types || "" ), handler, data, selector );
};
jQuery.event.remove = function( elem, types, handler, selector, mappedTypes ){
	eventRemove.call( this, elem, hoverHack( types ) || "", handler, selector, mappedTypes );
};

jQuery.each( [ "load", "unload", "error" ], function( _, name ) {

	jQuery.fn[ name ] = function() {
		var args = Array.prototype.slice.call( arguments, 0 );

		// If this is an ajax load() the first arg should be the string URL;
		// technically this could also be the "Anything" arg of the event .load()
		// which just goes to show why this dumb signature has been deprecated!
		// jQuery custom builds that exclude the Ajax module justifiably die here.
		if ( name === "load" && typeof args[ 0 ] === "string" ) {
			return oldLoad.apply( this, args );
		}

		migrateWarn( "jQuery.fn." + name + "() is deprecated" );

		args.splice( 0, 0, name );
		if ( arguments.length ) {
			return this.bind.apply( this, args );
		}

		// Use .triggerHandler here because:
		// - load and unload events don't need to bubble, only applied to window or image
		// - error event should not bubble to window, although it does pre-1.7
		// See http://bugs.jquery.com/ticket/11820
		this.triggerHandler.apply( this, args );
		return this;
	};

});

jQuery.fn.toggle = function( fn, fn2 ) {

	// Don't mess with animation or css toggles
	if ( !jQuery.isFunction( fn ) || !jQuery.isFunction( fn2 ) ) {
		return oldToggle.apply( this, arguments );
	}
	migrateWarn("jQuery.fn.toggle(handler, handler...) is deprecated");

	// Save reference to arguments for access in closure
	var args = arguments,
		guid = fn.guid || jQuery.guid++,
		i = 0,
		toggler = function( event ) {
			// Figure out which function to execute
			var lastToggle = ( jQuery._data( this, "lastToggle" + fn.guid ) || 0 ) % i;
			jQuery._data( this, "lastToggle" + fn.guid, lastToggle + 1 );

			// Make sure that clicks stop
			event.preventDefault();

			// and execute the function
			return args[ lastToggle ].apply( this, arguments ) || false;
		};

	// link all the functions, so any of them can unbind this click handler
	toggler.guid = guid;
	while ( i < args.length ) {
		args[ i++ ].guid = guid;
	}

	return this.click( toggler );
};

jQuery.fn.live = function( types, data, fn ) {
	migrateWarn("jQuery.fn.live() is deprecated");
	if ( oldLive ) {
		return oldLive.apply( this, arguments );
	}
	jQuery( this.context ).on( types, this.selector, data, fn );
	return this;
};

jQuery.fn.die = function( types, fn ) {
	migrateWarn("jQuery.fn.die() is deprecated");
	if ( oldDie ) {
		return oldDie.apply( this, arguments );
	}
	jQuery( this.context ).off( types, this.selector || "**", fn );
	return this;
};

// Turn global events into document-triggered events
jQuery.event.trigger = function( event, data, elem, onlyHandlers  ){
	if ( !elem && !rajaxEvent.test( event ) ) {
		migrateWarn( "Global events are undocumented and deprecated" );
	}
	return eventTrigger.call( this,  event, data, elem || document, onlyHandlers  );
};
jQuery.each( ajaxEvents.split("|"),
	function( _, name ) {
		jQuery.event.special[ name ] = {
			setup: function() {
				var elem = this;

				// The document needs no shimming; must be !== for oldIE
				if ( elem !== document ) {
					jQuery.event.add( document, name + "." + jQuery.guid, function() {
						jQuery.event.trigger( name, Array.prototype.slice.call( arguments, 1 ), elem, true );
					});
					jQuery._data( this, name, jQuery.guid++ );
				}
				return false;
			},
			teardown: function() {
				if ( this !== document ) {
					jQuery.event.remove( document, name + "." + jQuery._data( this, name ) );
				}
				return false;
			}
		};
	}
);

jQuery.event.special.ready = {
	setup: function() {
		if ( this === document ) {
			migrateWarn( "'ready' event is deprecated" );
		}
	}
};

var oldSelf = jQuery.fn.andSelf || jQuery.fn.addBack,
	oldFnFind = jQuery.fn.find;

jQuery.fn.andSelf = function() {
	migrateWarn("jQuery.fn.andSelf() replaced by jQuery.fn.addBack()");
	return oldSelf.apply( this, arguments );
};

jQuery.fn.find = function( selector ) {
	var ret = oldFnFind.apply( this, arguments );
	ret.context = this.context;
	ret.selector = this.selector ? this.selector + " " + selector : selector;
	return ret;
};


// jQuery 1.6 did not support Callbacks, do not warn there
if ( jQuery.Callbacks ) {

	var oldDeferred = jQuery.Deferred,
		tuples = [
			// action, add listener, callbacks, .then handlers, final state
			[ "resolve", "done", jQuery.Callbacks("once memory"),
				jQuery.Callbacks("once memory"), "resolved" ],
			[ "reject", "fail", jQuery.Callbacks("once memory"),
				jQuery.Callbacks("once memory"), "rejected" ],
			[ "notify", "progress", jQuery.Callbacks("memory"),
				jQuery.Callbacks("memory") ]
		];

	jQuery.Deferred = function( func ) {
		var deferred = oldDeferred(),
			promise = deferred.promise();

		deferred.pipe = promise.pipe = function( /* fnDone, fnFail, fnProgress */ ) {
			var fns = arguments;

			migrateWarn( "deferred.pipe() is deprecated" );

			return jQuery.Deferred(function( newDefer ) {
				jQuery.each( tuples, function( i, tuple ) {
					var fn = jQuery.isFunction( fns[ i ] ) && fns[ i ];
					// deferred.done(function() { bind to newDefer or newDefer.resolve })
					// deferred.fail(function() { bind to newDefer or newDefer.reject })
					// deferred.progress(function() { bind to newDefer or newDefer.notify })
					deferred[ tuple[1] ](function() {
						var returned = fn && fn.apply( this, arguments );
						if ( returned && jQuery.isFunction( returned.promise ) ) {
							returned.promise()
								.done( newDefer.resolve )
								.fail( newDefer.reject )
								.progress( newDefer.notify );
						} else {
							newDefer[ tuple[ 0 ] + "With" ](
								this === promise ? newDefer.promise() : this,
								fn ? [ returned ] : arguments
							);
						}
					});
				});
				fns = null;
			}).promise();

		};

		deferred.isResolved = function() {
			migrateWarn( "deferred.isResolved is deprecated" );
			return deferred.state() === "resolved";
		};

		deferred.isRejected = function() {
			migrateWarn( "deferred.isRejected is deprecated" );
			return deferred.state() === "rejected";
		};

		if ( func ) {
			func.call( deferred, deferred );
		}

		return deferred;
	};

}

})( jQuery, window );




/*! foundation */
function _classCallCheck(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}function _classCallCheck(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}function _classCallCheck(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}function _classCallCheck(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}function _classCallCheck(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}function _classCallCheck(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}function _classCallCheck(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}function _classCallCheck(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}function _classCallCheck(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}function _classCallCheck(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}function _classCallCheck(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}function _classCallCheck(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}function _classCallCheck(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}function _classCallCheck(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}function _classCallCheck(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}function _classCallCheck(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}function _classCallCheck(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}function _classCallCheck(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}function _classCallCheck(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}!function(t){"use strict";function e(t){if(void 0===Function.prototype.name){var e=/function\s([^(]{1,})\(/,i=e.exec(t.toString());return i&&i.length>1?i[1].trim():""}return void 0===t.prototype?t.constructor.name:t.prototype.constructor.name}function i(t){return/true/.test(t)?!0:/false/.test(t)?!1:isNaN(1*t)?t:parseFloat(t)}function n(t){return t.replace(/([a-z])([A-Z])/g,"$1-$2").toLowerCase()}var s="6.2.2",o={version:s,_plugins:{},_uuids:[],rtl:function(){return"rtl"===t("html").attr("dir")},plugin:function(t,i){var s=i||e(t),o=n(s);this._plugins[o]=this[s]=t},registerPlugin:function(t,i){var s=i?n(i):e(t.constructor).toLowerCase();t.uuid=this.GetYoDigits(6,s),t.$element.attr("data-"+s)||t.$element.attr("data-"+s,t.uuid),t.$element.data("zfPlugin")||t.$element.data("zfPlugin",t),t.$element.trigger("init.zf."+s),this._uuids.push(t.uuid)},unregisterPlugin:function(t){var i=n(e(t.$element.data("zfPlugin").constructor));this._uuids.splice(this._uuids.indexOf(t.uuid),1),t.$element.removeAttr("data-"+i).removeData("zfPlugin").trigger("destroyed.zf."+i);for(var s in t)t[s]=null},reInit:function(e){var i=e instanceof t;try{if(i)e.each(function(){t(this).data("zfPlugin")._init()});else{var s=typeof e,o=this,a={object:function(e){e.forEach(function(e){e=n(e),t("[data-"+e+"]").foundation("_init")})},string:function(){e=n(e),t("[data-"+e+"]").foundation("_init")},undefined:function(){this.object(Object.keys(o._plugins))}};a[s](e)}}catch(r){console.error(r)}finally{return e}},GetYoDigits:function(t,e){return t=t||6,Math.round(Math.pow(36,t+1)-Math.random()*Math.pow(36,t)).toString(36).slice(1)+(e?"-"+e:"")},reflow:function(e,n){"undefined"==typeof n?n=Object.keys(this._plugins):"string"==typeof n&&(n=[n]);var s=this;t.each(n,function(n,o){var a=s._plugins[o],r=t(e).find("[data-"+o+"]").addBack("[data-"+o+"]");r.each(function(){var e=t(this),n={};if(e.data("zfPlugin"))return void console.warn("Tried to initialize "+o+" on an element that already has a Foundation plugin.");if(e.attr("data-options")){e.attr("data-options").split(";").forEach(function(t,e){var s=t.split(":").map(function(t){return t.trim()});s[0]&&(n[s[0]]=i(s[1]))})}try{e.data("zfPlugin",new a(t(this),n))}catch(s){console.error(s)}finally{return}})})},getFnName:e,transitionend:function(t){var e,i={transition:"transitionend",WebkitTransition:"webkitTransitionEnd",MozTransition:"transitionend",OTransition:"otransitionend"},n=document.createElement("div");for(var s in i)"undefined"!=typeof n.style[s]&&(e=i[s]);return e?e:(e=setTimeout(function(){t.triggerHandler("transitionend",[t])},1),"transitionend")}};o.util={throttle:function(t,e){var i=null;return function(){var n=this,s=arguments;null===i&&(i=setTimeout(function(){t.apply(n,s),i=null},e))}}};var a=function(i){var n=typeof i,s=t("meta.foundation-mq"),a=t(".no-js");if(s.length||t('<meta class="foundation-mq">').appendTo(document.head),a.length&&a.removeClass("no-js"),"undefined"===n)o.MediaQuery._init(),o.reflow(this);else{if("string"!==n)throw new TypeError("We're sorry, "+n+" is not a valid parameter. You must use a string representing the method you wish to invoke.");var r=Array.prototype.slice.call(arguments,1),l=this.data("zfPlugin");if(void 0===l||void 0===l[i])throw new ReferenceError("We're sorry, '"+i+"' is not an available method for "+(l?e(l):"this element")+".");1===this.length?l[i].apply(l,r):this.each(function(e,n){l[i].apply(t(n).data("zfPlugin"),r)})}return this};window.Foundation=o,t.fn.foundation=a,function(){Date.now&&window.Date.now||(window.Date.now=Date.now=function(){return(new Date).getTime()});for(var t=["webkit","moz"],e=0;e<t.length&&!window.requestAnimationFrame;++e){var i=t[e];window.requestAnimationFrame=window[i+"RequestAnimationFrame"],window.cancelAnimationFrame=window[i+"CancelAnimationFrame"]||window[i+"CancelRequestAnimationFrame"]}if(/iP(ad|hone|od).*OS 6/.test(window.navigator.userAgent)||!window.requestAnimationFrame||!window.cancelAnimationFrame){var n=0;window.requestAnimationFrame=function(t){var e=Date.now(),i=Math.max(n+16,e);return setTimeout(function(){t(n=i)},i-e)},window.cancelAnimationFrame=clearTimeout}window.performance&&window.performance.now||(window.performance={start:Date.now(),now:function(){return Date.now()-this.start}})}(),Function.prototype.bind||(Function.prototype.bind=function(t){if("function"!=typeof this)throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");var e=Array.prototype.slice.call(arguments,1),i=this,n=function(){},s=function(){return i.apply(this instanceof n?this:t,e.concat(Array.prototype.slice.call(arguments)))};return this.prototype&&(n.prototype=this.prototype),s.prototype=new n,s})}(jQuery),!function(t){function e(t){var e={};return"string"!=typeof t?e:(t=t.trim().slice(1,-1))?e=t.split("&").reduce(function(t,e){var i=e.replace(/\+/g," ").split("="),n=i[0],s=i[1];return n=decodeURIComponent(n),s=void 0===s?null:decodeURIComponent(s),t.hasOwnProperty(n)?Array.isArray(t[n])?t[n].push(s):t[n]=[t[n],s]:t[n]=s,t},{}):e}var i={queries:[],current:"",_init:function(){var i,n=this,s=t(".foundation-mq").css("font-family");i=e(s);for(var o in i)i.hasOwnProperty(o)&&n.queries.push({name:o,value:"only screen and (min-width: "+i[o]+")"});this.current=this._getCurrentSize(),this._watcher()},atLeast:function(t){var e=this.get(t);return e?window.matchMedia(e).matches:!1},get:function(t){for(var e in this.queries)if(this.queries.hasOwnProperty(e)){var i=this.queries[e];if(t===i.name)return i.value}return null},_getCurrentSize:function(){for(var t,e=0;e<this.queries.length;e++){var i=this.queries[e];window.matchMedia(i.value).matches&&(t=i)}return"object"==typeof t?t.name:t},_watcher:function(){var e=this;t(window).on("resize.zf.mediaquery",function(){var i=e._getCurrentSize(),n=e.current;i!==n&&(e.current=i,t(window).trigger("changed.zf.mediaquery",[i,n]))})}};Foundation.MediaQuery=i,window.matchMedia||(window.matchMedia=function(){"use strict";var t=window.styleMedia||window.media;if(!t){var e=document.createElement("style"),i=document.getElementsByTagName("script")[0],n=null;e.type="text/css",e.id="matchmediajs-test",i.parentNode.insertBefore(e,i),n="getComputedStyle"in window&&window.getComputedStyle(e,null)||e.currentStyle,t={matchMedium:function(t){var i="@media "+t+"{ #matchmediajs-test { width: 1px; } }";return e.styleSheet?e.styleSheet.cssText=i:e.textContent=i,"1px"===n.width}}}return function(e){return{matches:t.matchMedium(e||"all"),media:e||"all"}}}()),Foundation.MediaQuery=i}(jQuery),!function(t){function e(t,e,n,s){var o,a,r,l,u=i(t);if(e){var d=i(e);a=u.offset.top+u.height<=d.height+d.offset.top,o=u.offset.top>=d.offset.top,r=u.offset.left>=d.offset.left,l=u.offset.left+u.width<=d.width+d.offset.left}else a=u.offset.top+u.height<=u.windowDims.height+u.windowDims.offset.top,o=u.offset.top>=u.windowDims.offset.top,r=u.offset.left>=u.windowDims.offset.left,l=u.offset.left+u.width<=u.windowDims.width;var h=[a,o,r,l];return n?r===l==!0:s?o===a==!0:-1===h.indexOf(!1)}function i(t,e){if(t=t.length?t[0]:t,t===window||t===document)throw new Error("I'm sorry, Dave. I'm afraid I can't do that.");var i=t.getBoundingClientRect(),n=t.parentNode.getBoundingClientRect(),s=document.body.getBoundingClientRect(),o=window.pageYOffset,a=window.pageXOffset;return{width:i.width,height:i.height,offset:{top:i.top+o,left:i.left+a},parentDims:{width:n.width,height:n.height,offset:{top:n.top+o,left:n.left+a}},windowDims:{width:s.width,height:s.height,offset:{top:o,left:a}}}}function n(t,e,n,s,o,a){var r=i(t),l=e?i(e):null;switch(n){case"top":return{left:Foundation.rtl()?l.offset.left-r.width+l.width:l.offset.left,top:l.offset.top-(r.height+s)};case"left":return{left:l.offset.left-(r.width+o),top:l.offset.top};case"right":return{left:l.offset.left+l.width+o,top:l.offset.top};case"center top":return{left:l.offset.left+l.width/2-r.width/2,top:l.offset.top-(r.height+s)};case"center bottom":return{left:a?o:l.offset.left+l.width/2-r.width/2,top:l.offset.top+l.height+s};case"center left":return{left:l.offset.left-(r.width+o),top:l.offset.top+l.height/2-r.height/2};case"center right":return{left:l.offset.left+l.width+o+1,top:l.offset.top+l.height/2-r.height/2};case"center":return{left:r.windowDims.offset.left+r.windowDims.width/2-r.width/2,top:r.windowDims.offset.top+r.windowDims.height/2-r.height/2};case"reveal":return{left:(r.windowDims.width-r.width)/2,top:r.windowDims.offset.top+s};case"reveal full":return{left:r.windowDims.offset.left,top:r.windowDims.offset.top};case"left bottom":return{left:l.offset.left-(r.width+o),top:l.offset.top+l.height};case"right bottom":return{left:l.offset.left+l.width+o-r.width,top:l.offset.top+l.height};default:return{left:Foundation.rtl()?l.offset.left-r.width+l.width:l.offset.left,top:l.offset.top+l.height+s}}}Foundation.Box={ImNotTouchingYou:e,GetDimensions:i,GetOffsets:n}}(jQuery),!function(t){function e(t,e,i){function n(r){a||(a=window.performance.now()),o=r-a,i.apply(e),t>o?s=window.requestAnimationFrame(n,e):(window.cancelAnimationFrame(s),e.trigger("finished.zf.animate",[e]).triggerHandler("finished.zf.animate",[e]))}var s,o,a=null;s=window.requestAnimationFrame(n)}function i(e,i,o,a){function r(){e||i.hide(),l(),a&&a.apply(i)}function l(){i[0].style.transitionDuration=0,i.removeClass(u+" "+d+" "+o)}if(i=t(i).eq(0),i.length){var u=e?n[0]:n[1],d=e?s[0]:s[1];l(),i.addClass(o).css("transition","none"),requestAnimationFrame(function(){i.addClass(u),e&&i.show()}),requestAnimationFrame(function(){i[0].offsetWidth,i.css("transition","").addClass(d)}),i.one(Foundation.transitionend(i),r)}}var n=["mui-enter","mui-leave"],s=["mui-enter-active","mui-leave-active"],o={animateIn:function(t,e,n){i(!0,t,e,n)},animateOut:function(t,e,n){i(!1,t,e,n)}};Foundation.Move=e,Foundation.Motion=o}(jQuery),!function(t){function e(){o(),n(),s(),i()}function i(e){var i=t("[data-yeti-box]"),n=["dropdown","tooltip","reveal"];if(e&&("string"==typeof e?n.push(e):"object"==typeof e&&"string"==typeof e[0]?n.concat(e):console.error("Plugin names must be strings")),i.length){var s=n.map(function(t){return"closeme.zf."+t}).join(" ");t(window).off(s).on(s,function(e,i){var n=e.namespace.split(".")[0],s=t("[data-"+n+"]").not('[data-yeti-box="'+i+'"]');s.each(function(){var e=t(this);e.triggerHandler("close.zf.trigger",[e])})})}}function n(e){var i=void 0,n=t("[data-resize]");n.length&&t(window).off("resize.zf.trigger").on("resize.zf.trigger",function(s){i&&clearTimeout(i),i=setTimeout(function(){a||n.each(function(){t(this).triggerHandler("resizeme.zf.trigger")}),n.attr("data-events","resize")},e||10)})}function s(e){var i=void 0,n=t("[data-scroll]");n.length&&t(window).off("scroll.zf.trigger").on("scroll.zf.trigger",function(s){i&&clearTimeout(i),i=setTimeout(function(){a||n.each(function(){t(this).triggerHandler("scrollme.zf.trigger")}),n.attr("data-events","scroll")},e||10)})}function o(){if(!a)return!1;var e=document.querySelectorAll("[data-resize], [data-scroll], [data-mutate]"),i=function(e){var i=t(e[0].target);switch(i.attr("data-events")){case"resize":i.triggerHandler("resizeme.zf.trigger",[i]);break;case"scroll":i.triggerHandler("scrollme.zf.trigger",[i,window.pageYOffset]);break;default:return!1}};if(e.length)for(var n=0;n<=e.length-1;n++){var s=new a(i);s.observe(e[n],{attributes:!0,childList:!1,characterData:!1,subtree:!1,attributeFilter:["data-events"]})}}var a=function(){for(var t=["WebKit","Moz","O","Ms",""],e=0;e<t.length;e++)if(t[e]+"MutationObserver"in window)return window[t[e]+"MutationObserver"];return!1}(),r=function(e,i){e.data(i).split(" ").forEach(function(n){t("#"+n)["close"===i?"trigger":"triggerHandler"](i+".zf.trigger",[e])})};t(document).on("click.zf.trigger","[data-open]",function(){r(t(this),"open")}),t(document).on("click.zf.trigger","[data-close]",function(){var e=t(this).data("close");e?r(t(this),"close"):t(this).trigger("close.zf.trigger")}),t(document).on("click.zf.trigger","[data-toggle]",function(){r(t(this),"toggle")}),t(document).on("close.zf.trigger","[data-closable]",function(e){e.stopPropagation();var i=t(this).data("closable");""!==i?Foundation.Motion.animateOut(t(this),i,function(){t(this).trigger("closed.zf")}):t(this).fadeOut().trigger("closed.zf")}),t(document).on("focus.zf.trigger blur.zf.trigger","[data-toggle-focus]",function(){var e=t(this).data("toggle-focus");t("#"+e).triggerHandler("toggle.zf.trigger",[t(this)])}),t(window).load(function(){e()}),Foundation.IHearYou=e}(jQuery),!function(t){function e(t){var e={};for(var i in t)e[t[i]]=t[i];return e}var i={9:"TAB",13:"ENTER",27:"ESCAPE",32:"SPACE",37:"ARROW_LEFT",38:"ARROW_UP",39:"ARROW_RIGHT",40:"ARROW_DOWN"},n={},s={keys:e(i),parseKey:function(t){var e=i[t.which||t.keyCode]||String.fromCharCode(t.which).toUpperCase();return t.shiftKey&&(e="SHIFT_"+e),t.ctrlKey&&(e="CTRL_"+e),t.altKey&&(e="ALT_"+e),e},handleKey:function(e,i,s){var o,a,r,l=n[i],u=this.parseKey(e);if(!l)return console.warn("Component not defined!");if(o="undefined"==typeof l.ltr?l:Foundation.rtl()?t.extend({},l.ltr,l.rtl):t.extend({},l.rtl,l.ltr),a=o[u],r=s[a],r&&"function"==typeof r){var d=r.apply();(s.handled||"function"==typeof s.handled)&&s.handled(d)}else(s.unhandled||"function"==typeof s.unhandled)&&s.unhandled()},findFocusable:function(e){return e.find("a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, *[tabindex], *[contenteditable]").filter(function(){return t(this).is(":visible")&&!(t(this).attr("tabindex")<0)})},register:function(t,e){n[t]=e}};Foundation.Keyboard=s}(jQuery),!function(t){var e={Feather:function(e){var i=arguments.length<=1||void 0===arguments[1]?"zf":arguments[1];e.attr("role","menubar");var n=e.find("li").attr({role:"menuitem"}),s="is-"+i+"-submenu",o=s+"-item",a="is-"+i+"-submenu-parent";e.find("a:first").attr("tabindex",0),n.each(function(){var e=t(this),i=e.children("ul");i.length&&(e.addClass(a).attr({"aria-haspopup":!0,"aria-expanded":!1,"aria-label":e.children("a:first").text()}),i.addClass("submenu "+s).attr({"data-submenu":"","aria-hidden":!0,role:"menu"})),e.parent("[data-submenu]").length&&e.addClass("is-submenu-item "+o)})},Burn:function(t,e){var i=(t.find("li").removeAttr("tabindex"),"is-"+e+"-submenu"),n=i+"-item",s="is-"+e+"-submenu-parent";t.find("*").removeClass(i+" "+n+" "+s+" is-submenu-item submenu is-active").removeAttr("data-submenu").css("display","")}};Foundation.Nest=e}(jQuery),!function(t){function e(t,e,i){var n,s,o=this,a=e.duration,r=Object.keys(t.data())[0]||"timer",l=-1;this.isPaused=!1,this.restart=function(){l=-1,clearTimeout(s),this.start()},this.start=function(){this.isPaused=!1,clearTimeout(s),l=0>=l?a:l,t.data("paused",!1),n=Date.now(),s=setTimeout(function(){e.infinite&&o.restart(),i()},l),t.trigger("timerstart.zf."+r)},this.pause=function(){this.isPaused=!0,clearTimeout(s),t.data("paused",!0);var e=Date.now();l-=e-n,t.trigger("timerpaused.zf."+r)}}function i(e,i){function n(){s--,0===s&&i()}var s=e.length;0===s&&i(),e.each(function(){this.complete?n():"undefined"!=typeof this.naturalWidth&&this.naturalWidth>0?n():t(this).one("load",function(){n()})})}Foundation.Timer=e,Foundation.onImagesLoaded=i}(jQuery),function(t){function e(){this.removeEventListener("touchmove",i),this.removeEventListener("touchend",e),u=!1}function i(i){if(t.spotSwipe.preventDefault&&i.preventDefault(),u){var n,s=i.touches[0].pageX,a=(i.touches[0].pageY,o-s);l=(new Date).getTime()-r,Math.abs(a)>=t.spotSwipe.moveThreshold&&l<=t.spotSwipe.timeThreshold&&(n=a>0?"left":"right"),n&&(i.preventDefault(),e.call(this),t(this).trigger("swipe",n).trigger("swipe"+n))}}function n(t){1==t.touches.length&&(o=t.touches[0].pageX,a=t.touches[0].pageY,u=!0,r=(new Date).getTime(),this.addEventListener("touchmove",i,!1),this.addEventListener("touchend",e,!1))}function s(){this.addEventListener&&this.addEventListener("touchstart",n,!1)}t.spotSwipe={version:"1.0.0",enabled:"ontouchstart"in document.documentElement,preventDefault:!1,moveThreshold:75,timeThreshold:200};var o,a,r,l,u=!1;t.event.special.swipe={setup:s},t.each(["left","up","down","right"],function(){t.event.special["swipe"+this]={setup:function(){t(this).on("swipe",t.noop)}}})}(jQuery),!function(t){t.fn.addTouch=function(){this.each(function(i,n){t(n).bind("touchstart touchmove touchend touchcancel",function(){e(event)})});var e=function(t){var e,i=t.changedTouches,n=i[0],s={touchstart:"mousedown",touchmove:"mousemove",touchend:"mouseup"},o=s[t.type];"MouseEvent"in window&&"function"==typeof window.MouseEvent?e=new window.MouseEvent(o,{bubbles:!0,cancelable:!0,screenX:n.screenX,screenY:n.screenY,clientX:n.clientX,clientY:n.clientY}):(e=document.createEvent("MouseEvent"),e.initMouseEvent(o,!0,!0,window,1,n.screenX,n.screenY,n.clientX,n.clientY,!1,!1,!1,!1,0,null)),n.target.dispatchEvent(e)}}}(jQuery);var _createClass=function(){function t(t,e){for(var i=0;i<e.length;i++){var n=e[i];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,n.key,n)}}return function(e,i,n){return i&&t(e.prototype,i),n&&t(e,n),e}}();!function(t){function e(t,e){return t/e}function i(t,e,i,n){return Math.abs(t.position()[e]+t[n]()/2-i)}var n=function(){function n(e,i){_classCallCheck(this,n),this.$element=e,this.options=t.extend({},n.defaults,this.$element.data(),i),this._init(),Foundation.registerPlugin(this,"Slider"),Foundation.Keyboard.register("Slider",{ltr:{ARROW_RIGHT:"increase",ARROW_UP:"increase",ARROW_DOWN:"decrease",ARROW_LEFT:"decrease",SHIFT_ARROW_RIGHT:"increase_fast",SHIFT_ARROW_UP:"increase_fast",SHIFT_ARROW_DOWN:"decrease_fast",SHIFT_ARROW_LEFT:"decrease_fast"},rtl:{ARROW_LEFT:"increase",ARROW_RIGHT:"decrease",SHIFT_ARROW_LEFT:"increase_fast",SHIFT_ARROW_RIGHT:"decrease_fast"}})}return _createClass(n,[{key:"_init",value:function(){this.inputs=this.$element.find("input"),this.handles=this.$element.find("[data-slider-handle]"),this.$handle=this.handles.eq(0),this.$input=this.inputs.length?this.inputs.eq(0):t("#"+this.$handle.attr("aria-controls")),this.$fill=this.$element.find("[data-slider-fill]").css(this.options.vertical?"height":"width",0);var e=!1,i=this;(this.options.disabled||this.$element.hasClass(this.options.disabledClass))&&(this.options.disabled=!0,this.$element.addClass(this.options.disabledClass)),this.inputs.length||(this.inputs=t().add(this.$input),this.options.binding=!0),this._setInitAttr(0),this._events(this.$handle),this.handles[1]&&(this.options.doubleSided=!0,this.$handle2=this.handles.eq(1),this.$input2=this.inputs.length>1?this.inputs.eq(1):t("#"+this.$handle2.attr("aria-controls")),this.inputs[1]||(this.inputs=this.inputs.add(this.$input2)),e=!0,this._setHandlePos(this.$handle,this.options.initialStart,!0,function(){i._setHandlePos(i.$handle2,i.options.initialEnd,!0)}),this._setInitAttr(1),this._events(this.$handle2)),e||this._setHandlePos(this.$handle,this.options.initialStart,!0)}},{key:"_setHandlePos",value:function(t,i,n,s){if(!this.$element.hasClass(this.options.disabledClass)){i=parseFloat(i),i<this.options.start?i=this.options.start:i>this.options.end&&(i=this.options.end);var o=this.options.doubleSided;if(o)if(0===this.handles.index(t)){var a=parseFloat(this.$handle2.attr("aria-valuenow"));i=i>=a?a-this.options.step:i}else{var r=parseFloat(this.$handle.attr("aria-valuenow"));i=r>=i?r+this.options.step:i}this.options.vertical&&!n&&(i=this.options.end-i);var l=this,u=this.options.vertical,d=u?"height":"width",h=u?"top":"left",c=t[0].getBoundingClientRect()[d],f=this.$element[0].getBoundingClientRect()[d],p=e(i-this.options.start,this.options.end-this.options.start).toFixed(2),m=(f-c)*p,v=(100*e(m,f)).toFixed(this.options.decimal);i=parseFloat(i.toFixed(this.options.decimal));var g={};if(this._setValues(t,i),o){var w,y=0===this.handles.index(t),b=~~(100*e(c,f));if(y)g[h]=v+"%",w=parseFloat(this.$handle2[0].style[h])-v+b,s&&"function"==typeof s&&s();else{var $=parseFloat(this.$handle[0].style[h]);w=v-(isNaN($)?this.options.initialStart/((this.options.end-this.options.start)/100):$)+b}g["min-"+d]=w+"%"}this.$element.one("finished.zf.animate",function(){l.$element.trigger("moved.zf.slider",[t])});var C=this.$element.data("dragging")?1e3/60:this.options.moveTime;Foundation.Move(C,t,function(){t.css(h,v+"%"),l.options.doubleSided?l.$fill.css(g):l.$fill.css(d,100*p+"%")}),clearTimeout(l.timeout),l.timeout=setTimeout(function(){l.$element.trigger("changed.zf.slider",[t])},l.options.changedDelay)}}},{key:"_setInitAttr",value:function(t){var e=this.inputs.eq(t).attr("id")||Foundation.GetYoDigits(6,"slider");this.inputs.eq(t).attr({id:e,max:this.options.end,min:this.options.start,step:this.options.step}),this.handles.eq(t).attr({role:"slider","aria-controls":e,"aria-valuemax":this.options.end,"aria-valuemin":this.options.start,"aria-valuenow":0===t?this.options.initialStart:this.options.initialEnd,"aria-orientation":this.options.vertical?"vertical":"horizontal",tabindex:0})}},{key:"_setValues",value:function(t,e){var i=this.options.doubleSided?this.handles.index(t):0;this.inputs.eq(i).val(e),t.attr("aria-valuenow",e)}},{key:"_handleEvent",value:function(n,s,o){var a,r;if(o)a=this._adjustValue(null,o),r=!0;else{n.preventDefault();var l=this,u=this.options.vertical,d=u?"height":"width",h=u?"top":"left",c=u?n.pageY:n.pageX,f=(this.$handle[0].getBoundingClientRect()[d]/2,this.$element[0].getBoundingClientRect()[d]),p=u?t(window).scrollTop():t(window).scrollLeft(),m=this.$element.offset()[h];n.clientY===n.pageY&&(c+=p);var v,g=c-m;if(v=0>g?0:g>f?f:g,offsetPct=e(v,f),a=(this.options.end-this.options.start)*offsetPct+this.options.start,Foundation.rtl()&&!this.options.vertical&&(a=this.options.end-a),a=l._adjustValue(null,a),r=!1,!s){var w=i(this.$handle,h,v,d),y=i(this.$handle2,h,v,d);s=y>=w?this.$handle:this.$handle2}}this._setHandlePos(s,a,r)}},{key:"_adjustValue",value:function(t,e){var i,n,s,o,a=this.options.step,r=parseFloat(a/2);return i=t?parseFloat(t.attr("aria-valuenow")):e,n=i%a,s=i-n,o=s+a,0===n?i:i=i>=s+r?o:s}},{key:"_events",value:function(e){var i,n=this;if(this.inputs.off("change.zf.slider").on("change.zf.slider",function(e){var i=n.inputs.index(t(this));n._handleEvent(e,n.handles.eq(i),t(this).val())}),this.options.clickSelect&&this.$element.off("click.zf.slider").on("click.zf.slider",function(e){return n.$element.data("dragging")?!1:void(t(e.target).is("[data-slider-handle]")||(n.options.doubleSided?n._handleEvent(e):n._handleEvent(e,n.$handle)))}),this.options.draggable){this.handles.addTouch();var s=t("body");e.off("mousedown.zf.slider").on("mousedown.zf.slider",function(o){e.addClass("is-dragging"),n.$fill.addClass("is-dragging"),n.$element.data("dragging",!0),i=t(o.currentTarget),s.on("mousemove.zf.slider",function(t){t.preventDefault(),n._handleEvent(t,i)}).on("mouseup.zf.slider",function(t){n._handleEvent(t,i),e.removeClass("is-dragging"),n.$fill.removeClass("is-dragging"),n.$element.data("dragging",!1),s.off("mousemove.zf.slider mouseup.zf.slider")})}).on("selectstart.zf.slider touchmove.zf.slider",function(t){t.preventDefault()})}e.off("keydown.zf.slider").on("keydown.zf.slider",function(e){var i,s=t(this),o=n.options.doubleSided?n.handles.index(s):0,a=parseFloat(n.inputs.eq(o).val());Foundation.Keyboard.handleKey(e,"Slider",{decrease:function(){i=a-n.options.step},increase:function(){i=a+n.options.step},decrease_fast:function(){i=a-10*n.options.step},increase_fast:function(){i=a+10*n.options.step},handled:function(){e.preventDefault(),n._setHandlePos(s,i,!0)}})})}},{key:"destroy",value:function(){this.handles.off(".zf.slider"),this.inputs.off(".zf.slider"),this.$element.off(".zf.slider"),Foundation.unregisterPlugin(this)}}]),n}();n.defaults={start:0,end:100,step:1,initialStart:0,initialEnd:100,binding:!1,clickSelect:!0,vertical:!1,draggable:!0,disabled:!1,doubleSided:!1,decimal:2,moveTime:200,disabledClass:"disabled",invertVertical:!1,changedDelay:500},Foundation.plugin(n,"Slider")}(jQuery);var _createClass=function(){function t(t,e){for(var i=0;i<e.length;i++){var n=e[i];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,n.key,n)}}return function(e,i,n){return i&&t(e.prototype,i),n&&t(e,n),e}}();!function(t){var e=function(){function e(i,n){_classCallCheck(this,e),this.$element=i,this.options=t.extend({},e.defaults,this.$element.data(),n),Foundation.Nest.Feather(this.$element,"drilldown"),this._init(),Foundation.registerPlugin(this,"Drilldown"),Foundation.Keyboard.register("Drilldown",{ENTER:"open",SPACE:"open",ARROW_RIGHT:"next",ARROW_UP:"up",ARROW_DOWN:"down",ARROW_LEFT:"previous",ESCAPE:"close",TAB:"down",SHIFT_TAB:"up"})}return _createClass(e,[{key:"_init",value:function(){this.$submenuAnchors=this.$element.find("li.is-drilldown-submenu-parent").children("a"),this.$submenus=this.$submenuAnchors.parent("li").children("[data-submenu]"),this.$menuItems=this.$element.find("li").not(".js-drilldown-back").attr("role","menuitem").find("a"),this._prepareMenu(),this._keyboardEvents()}},{key:"_prepareMenu",value:function(){var e=this;this.$submenuAnchors.each(function(){var i=t(this),n=i.parent();e.options.parentLink&&i.clone().prependTo(n.children("[data-submenu]")).wrap('<li class="is-submenu-parent-item is-submenu-item is-drilldown-submenu-item" role="menu-item"></li>'),i.data("savedHref",i.attr("href")).removeAttr("href"),i.children("[data-submenu]").attr({"aria-hidden":!0,tabindex:0,role:"menu"}),e._events(i)}),this.$submenus.each(function(){var i=t(this),n=i.find(".js-drilldown-back");n.length||i.prepend(e.options.backButton),e._back(i)}),this.$element.parent().hasClass("is-drilldown")||(this.$wrapper=t(this.options.wrapper).addClass("is-drilldown"),this.$wrapper=this.$element.wrap(this.$wrapper).parent().css(this._getMaxDims()))}},{key:"_events",value:function(e){var i=this;e.off("click.zf.drilldown").on("click.zf.drilldown",function(n){if(t(n.target).parentsUntil("ul","li").hasClass("is-drilldown-submenu-parent")&&(n.stopImmediatePropagation(),n.preventDefault()),i._show(e.parent("li")),i.options.closeOnClick){var s=t("body");s.off(".zf.drilldown").on("click.zf.drilldown",function(e){e.target===i.$element[0]||t.contains(i.$element[0],e.target)||(e.preventDefault(),i._hideAll(),s.off(".zf.drilldown"))})}})}},{key:"_keyboardEvents",value:function(){var e=this;this.$menuItems.add(this.$element.find(".js-drilldown-back > a")).on("keydown.zf.drilldown",function(i){var n,s,o=t(this),a=o.parent("li").parent("ul").children("li").children("a");a.each(function(e){return t(this).is(o)?(n=a.eq(Math.max(0,e-1)),void(s=a.eq(Math.min(e+1,a.length-1)))):void 0}),Foundation.Keyboard.handleKey(i,"Drilldown",{next:function(){return o.is(e.$submenuAnchors)?(e._show(o.parent("li")),o.parent("li").one(Foundation.transitionend(o),function(){o.parent("li").find("ul li a").filter(e.$menuItems).first().focus()}),!0):void 0},previous:function(){return e._hide(o.parent("li").parent("ul")),o.parent("li").parent("ul").one(Foundation.transitionend(o),function(){setTimeout(function(){o.parent("li").parent("ul").parent("li").children("a").first().focus()},1)}),!0},up:function(){return n.focus(),!0},down:function(){return s.focus(),!0},close:function(){e._back()},open:function(){return o.is(e.$menuItems)?o.is(e.$submenuAnchors)&&(e._show(o.parent("li")),o.parent("li").one(Foundation.transitionend(o),function(){o.parent("li").find("ul li a").filter(e.$menuItems).first().focus()})):(e._hide(o.parent("li").parent("ul")),o.parent("li").parent("ul").one(Foundation.transitionend(o),function(){setTimeout(function(){o.parent("li").parent("ul").parent("li").children("a").first().focus()},1)})),!0},handled:function(t){t&&i.preventDefault(),i.stopImmediatePropagation()}})})}},{key:"_hideAll",value:function(){var t=this.$element.find(".is-drilldown-submenu.is-active").addClass("is-closing");t.one(Foundation.transitionend(t),function(e){t.removeClass("is-active is-closing")}),this.$element.trigger("closed.zf.drilldown")}},{key:"_back",value:function(t){var e=this;t.off("click.zf.drilldown"),t.children(".js-drilldown-back").on("click.zf.drilldown",function(i){i.stopImmediatePropagation(),e._hide(t)})}},{key:"_menuLinkEvents",value:function(){var t=this;this.$menuItems.not(".is-drilldown-submenu-parent").off("click.zf.drilldown").on("click.zf.drilldown",function(e){setTimeout(function(){t._hideAll()},0)})}},{key:"_show",value:function(t){t.children("[data-submenu]").addClass("is-active"),this.$element.trigger("open.zf.drilldown",[t])}},{key:"_hide",value:function(t){t.addClass("is-closing").one(Foundation.transitionend(t),function(){t.removeClass("is-active is-closing"),t.blur()}),t.trigger("hide.zf.drilldown",[t])}},{key:"_getMaxDims",value:function(){var e=0,i={};return this.$submenus.add(this.$element).each(function(){var i=t(this).children("li").length;e=i>e?i:e}),i["min-height"]=e*this.$menuItems[0].getBoundingClientRect().height+"px",i["max-width"]=this.$element[0].getBoundingClientRect().width+"px",i}},{key:"destroy",value:function(){this._hideAll(),Foundation.Nest.Burn(this.$element,"drilldown"),this.$element.unwrap().find(".js-drilldown-back, .is-submenu-parent-item").remove().end().find(".is-active, .is-closing, .is-drilldown-submenu").removeClass("is-active is-closing is-drilldown-submenu").end().find("[data-submenu]").removeAttr("aria-hidden tabindex role"),this.$submenuAnchors.each(function(){t(this).off(".zf.drilldown")}),this.$element.find("a").each(function(){var e=t(this);e.data("savedHref")&&e.attr("href",e.data("savedHref")).removeData("savedHref")}),Foundation.unregisterPlugin(this)}}]),e}();e.defaults={backButton:'<li class="js-drilldown-back"><a tabindex="0">Back</a></li>',wrapper:"<div></div>",parentLink:!1,closeOnClick:!1},Foundation.plugin(e,"Drilldown")}(jQuery);var _createClass=function(){function t(t,e){for(var i=0;i<e.length;i++){var n=e[i];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,n.key,n);
}}return function(e,i,n){return i&&t(e.prototype,i),n&&t(e,n),e}}();!function(t){var e=function(){function e(i,n){_classCallCheck(this,e),this.$element=i,this.options=t.extend({},e.defaults,this.$element.data(),n),Foundation.Nest.Feather(this.$element,"accordion"),this._init(),Foundation.registerPlugin(this,"AccordionMenu"),Foundation.Keyboard.register("AccordionMenu",{ENTER:"toggle",SPACE:"toggle",ARROW_RIGHT:"open",ARROW_UP:"up",ARROW_DOWN:"down",ARROW_LEFT:"close",ESCAPE:"closeAll",TAB:"down",SHIFT_TAB:"up"})}return _createClass(e,[{key:"_init",value:function(){this.$element.find("[data-submenu]").not(".is-active").slideUp(0),this.$element.attr({role:"tablist","aria-multiselectable":this.options.multiOpen}),this.$menuLinks=this.$element.find(".is-accordion-submenu-parent"),this.$menuLinks.each(function(){var e=this.id||Foundation.GetYoDigits(6,"acc-menu-link"),i=t(this),n=i.children("[data-submenu]"),s=n[0].id||Foundation.GetYoDigits(6,"acc-menu"),o=n.hasClass("is-active");i.attr({"aria-controls":s,"aria-expanded":o,role:"tab",id:e}),n.attr({"aria-labelledby":e,"aria-hidden":!o,role:"tabpanel",id:s})});var e=this.$element.find(".is-active");if(e.length){var i=this;e.each(function(){i.down(t(this))})}this._events()}},{key:"_events",value:function(){var e=this;this.$element.find("li").each(function(){var i=t(this).children("[data-submenu]");i.length&&t(this).children("a").off("click.zf.accordionMenu").on("click.zf.accordionMenu",function(t){t.preventDefault(),e.toggle(i)})}).on("keydown.zf.accordionmenu",function(i){var n,s,o=t(this),a=o.parent("ul").children("li"),r=o.children("[data-submenu]");a.each(function(e){return t(this).is(o)?(n=a.eq(Math.max(0,e-1)).find("a").first(),s=a.eq(Math.min(e+1,a.length-1)).find("a").first(),t(this).children("[data-submenu]:visible").length&&(s=o.find("li:first-child").find("a").first()),t(this).is(":first-child")?n=o.parents("li").first().find("a").first():n.children("[data-submenu]:visible").length&&(n=n.find("li:last-child").find("a").first()),void(t(this).is(":last-child")&&(s=o.parents("li").first().next("li").find("a").first()))):void 0}),Foundation.Keyboard.handleKey(i,"AccordionMenu",{open:function(){r.is(":hidden")&&(e.down(r),r.find("li").first().find("a").first().focus())},close:function(){r.length&&!r.is(":hidden")?e.up(r):o.parent("[data-submenu]").length&&(e.up(o.parent("[data-submenu]")),o.parents("li").first().find("a").first().focus())},up:function(){return n.attr("tabindex",-1).focus(),!0},down:function(){return s.attr("tabindex",-1).focus(),!0},toggle:function(){o.children("[data-submenu]").length&&e.toggle(o.children("[data-submenu]"))},closeAll:function(){e.hideAll()},handled:function(t){t&&i.preventDefault(),i.stopImmediatePropagation()}})})}},{key:"hideAll",value:function(){this.$element.find("[data-submenu]").slideUp(this.options.slideSpeed)}},{key:"toggle",value:function(t){t.is(":animated")||(t.is(":hidden")?this.down(t):this.up(t))}},{key:"down",value:function(t){var e=this;this.options.multiOpen||this.up(this.$element.find(".is-active").not(t.parentsUntil(this.$element).add(t))),t.addClass("is-active").attr({"aria-hidden":!1}).parent(".is-accordion-submenu-parent").attr({"aria-expanded":!0}),t.slideDown(e.options.slideSpeed,function(){e.$element.trigger("down.zf.accordionMenu",[t])})}},{key:"up",value:function(t){var e=this;t.slideUp(e.options.slideSpeed,function(){e.$element.trigger("up.zf.accordionMenu",[t])});var i=t.find("[data-submenu]").slideUp(0).addBack().attr("aria-hidden",!0);i.parent(".is-accordion-submenu-parent").attr("aria-expanded",!1)}},{key:"destroy",value:function(){this.$element.find("[data-submenu]").slideDown(0).css("display",""),this.$element.find("a").off("click.zf.accordionMenu"),Foundation.Nest.Burn(this.$element,"accordion"),Foundation.unregisterPlugin(this)}}]),e}();e.defaults={slideSpeed:250,multiOpen:!0},Foundation.plugin(e,"AccordionMenu")}(jQuery);var _createClass=function(){function t(t,e){for(var i=0;i<e.length;i++){var n=e[i];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,n.key,n)}}return function(e,i,n){return i&&t(e.prototype,i),n&&t(e,n),e}}();!function(t){var e=function(){function e(i,n){_classCallCheck(this,e),this.$element=i,this.options=t.extend({},e.defaults,this.$element.data(),n),Foundation.Nest.Feather(this.$element,"dropdown"),this._init(),Foundation.registerPlugin(this,"DropdownMenu"),Foundation.Keyboard.register("DropdownMenu",{ENTER:"open",SPACE:"open",ARROW_RIGHT:"next",ARROW_UP:"up",ARROW_DOWN:"down",ARROW_LEFT:"previous",ESCAPE:"close"})}return _createClass(e,[{key:"_init",value:function(){var t=this.$element.find("li.is-dropdown-submenu-parent");this.$element.children(".is-dropdown-submenu-parent").children(".is-dropdown-submenu").addClass("first-sub"),this.$menuItems=this.$element.find('[role="menuitem"]'),this.$tabs=this.$element.children('[role="menuitem"]'),this.$tabs.find("ul.is-dropdown-submenu").addClass(this.options.verticalClass),this.$element.hasClass(this.options.rightClass)||"right"===this.options.alignment||Foundation.rtl()||this.$element.parents(".top-bar-right").is("*")?(this.options.alignment="right",t.addClass("opens-left")):t.addClass("opens-right"),this.changed=!1,this._events()}},{key:"_events",value:function(){var e=this,i="ontouchstart"in window||"undefined"!=typeof window.ontouchstart,n="is-dropdown-submenu-parent",s=function(s){var o=t(s.target).parentsUntil("ul","."+n),a=o.hasClass(n),r="true"===o.attr("data-is-click");o.children(".is-dropdown-submenu");if(a)if(r){if(!e.options.closeOnClick||!e.options.clickOpen&&!i||e.options.forceFollow&&i)return;s.stopImmediatePropagation(),s.preventDefault(),e._hide(o)}else s.preventDefault(),s.stopImmediatePropagation(),e._show(o.children(".is-dropdown-submenu")),o.add(o.parentsUntil(e.$element,"."+n)).attr("data-is-click",!0)};(this.options.clickOpen||i)&&this.$menuItems.on("click.zf.dropdownmenu touchstart.zf.dropdownmenu",s),this.options.disableHover||this.$menuItems.on("mouseenter.zf.dropdownmenu",function(i){var s=t(this),o=s.hasClass(n);o&&(clearTimeout(e.delay),e.delay=setTimeout(function(){e._show(s.children(".is-dropdown-submenu"))},e.options.hoverDelay))}).on("mouseleave.zf.dropdownmenu",function(i){var s=t(this),o=s.hasClass(n);if(o&&e.options.autoclose){if("true"===s.attr("data-is-click")&&e.options.clickOpen)return!1;clearTimeout(e.delay),e.delay=setTimeout(function(){e._hide(s)},e.options.closingTime)}}),this.$menuItems.on("keydown.zf.dropdownmenu",function(i){var n,s,o=t(i.target).parentsUntil("ul",'[role="menuitem"]'),a=e.$tabs.index(o)>-1,r=a?e.$tabs:o.siblings("li").add(o);r.each(function(e){return t(this).is(o)?(n=r.eq(e-1),void(s=r.eq(e+1))):void 0});var l=function(){o.is(":last-child")||(s.children("a:first").focus(),i.preventDefault())},u=function(){n.children("a:first").focus(),i.preventDefault()},d=function(){var t=o.children("ul.is-dropdown-submenu");t.length&&(e._show(t),o.find("li > a:first").focus(),i.preventDefault())},h=function(){var t=o.parent("ul").parent("li");t.children("a:first").focus(),e._hide(t),i.preventDefault()},c={open:d,close:function(){e._hide(e.$element),e.$menuItems.find("a:first").focus(),i.preventDefault()},handled:function(){i.stopImmediatePropagation()}};a?e.$element.hasClass(e.options.verticalClass)?"left"===e.options.alignment?t.extend(c,{down:l,up:u,next:d,previous:h}):t.extend(c,{down:l,up:u,next:h,previous:d}):t.extend(c,{next:l,previous:u,down:d,up:h}):"left"===e.options.alignment?t.extend(c,{next:d,previous:h,down:l,up:u}):t.extend(c,{next:h,previous:d,down:l,up:u}),Foundation.Keyboard.handleKey(i,"DropdownMenu",c)})}},{key:"_addBodyHandler",value:function(){var e=t(document.body),i=this;e.off("mouseup.zf.dropdownmenu touchend.zf.dropdownmenu").on("mouseup.zf.dropdownmenu touchend.zf.dropdownmenu",function(t){var n=i.$element.find(t.target);n.length||(i._hide(),e.off("mouseup.zf.dropdownmenu touchend.zf.dropdownmenu"))})}},{key:"_show",value:function(e){var i=this.$tabs.index(this.$tabs.filter(function(i,n){return t(n).find(e).length>0})),n=e.parent("li.is-dropdown-submenu-parent").siblings("li.is-dropdown-submenu-parent");this._hide(n,i),e.css("visibility","hidden").addClass("js-dropdown-active").attr({"aria-hidden":!1}).parent("li.is-dropdown-submenu-parent").addClass("is-active").attr({"aria-expanded":!0});var s=Foundation.Box.ImNotTouchingYou(e,null,!0);if(!s){var o="left"===this.options.alignment?"-right":"-left",a=e.parent(".is-dropdown-submenu-parent");a.removeClass("opens"+o).addClass("opens-"+this.options.alignment),s=Foundation.Box.ImNotTouchingYou(e,null,!0),s||a.removeClass("opens-"+this.options.alignment).addClass("opens-inner"),this.changed=!0}e.css("visibility",""),this.options.closeOnClick&&this._addBodyHandler(),this.$element.trigger("show.zf.dropdownmenu",[e])}},{key:"_hide",value:function(t,e){var i;i=t&&t.length?t:void 0!==e?this.$tabs.not(function(t,i){return t===e}):this.$element;var n=i.hasClass("is-active")||i.find(".is-active").length>0;if(n){if(i.find("li.is-active").add(i).attr({"aria-expanded":!1,"data-is-click":!1}).removeClass("is-active"),i.find("ul.js-dropdown-active").attr({"aria-hidden":!0}).removeClass("js-dropdown-active"),this.changed||i.find("opens-inner").length){var s="left"===this.options.alignment?"right":"left";i.find("li.is-dropdown-submenu-parent").add(i).removeClass("opens-inner opens-"+this.options.alignment).addClass("opens-"+s),this.changed=!1}this.$element.trigger("hide.zf.dropdownmenu",[i])}}},{key:"destroy",value:function(){this.$menuItems.off(".zf.dropdownmenu").removeAttr("data-is-click").removeClass("is-right-arrow is-left-arrow is-down-arrow opens-right opens-left opens-inner"),t(document.body).off(".zf.dropdownmenu"),Foundation.Nest.Burn(this.$element,"dropdown"),Foundation.unregisterPlugin(this)}}]),e}();e.defaults={disableHover:!1,autoclose:!0,hoverDelay:50,clickOpen:!1,closingTime:500,alignment:"left",closeOnClick:!0,verticalClass:"vertical",rightClass:"align-right",forceFollow:!0},Foundation.plugin(e,"DropdownMenu")}(jQuery);var _createClass=function(){function t(t,e){for(var i=0;i<e.length;i++){var n=e[i];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,n.key,n)}}return function(e,i,n){return i&&t(e.prototype,i),n&&t(e,n),e}}();!function(t){var e=function(){function e(i,n){_classCallCheck(this,e),this.$element=i,this.options=t.extend({},e.defaults,this.$element.data(),n),this._init(),Foundation.registerPlugin(this,"Magellan")}return _createClass(e,[{key:"_init",value:function(){var e=this.$element[0].id||Foundation.GetYoDigits(6,"magellan");this.$targets=t("[data-magellan-target]"),this.$links=this.$element.find("a"),this.$element.attr({"data-resize":e,"data-scroll":e,id:e}),this.$active=t(),this.scrollPos=parseInt(window.pageYOffset,10),this._events()}},{key:"calcPoints",value:function(){var e=this,i=document.body,n=document.documentElement;this.points=[],this.winHeight=Math.round(Math.max(window.innerHeight,n.clientHeight)),this.docHeight=Math.round(Math.max(i.scrollHeight,i.offsetHeight,n.clientHeight,n.scrollHeight,n.offsetHeight)),this.$targets.each(function(){var i=t(this),n=Math.round(i.offset().top-e.options.threshold);i.targetPoint=n,e.points.push(n)})}},{key:"_events",value:function(){var e=this;t("html, body"),{duration:e.options.animationDuration,easing:e.options.animationEasing};t(window).one("load",function(){e.options.deepLinking&&location.hash&&e.scrollToLoc(location.hash),e.calcPoints(),e._updateActive()}),this.$element.on({"resizeme.zf.trigger":this.reflow.bind(this),"scrollme.zf.trigger":this._updateActive.bind(this)}).on("click.zf.magellan",'a[href^="#"]',function(t){t.preventDefault();var i=this.getAttribute("href");e.scrollToLoc(i)})}},{key:"scrollToLoc",value:function(e){var i=Math.round(t(e).offset().top-this.options.threshold/2-this.options.barOffset);t("html, body").stop(!0).animate({scrollTop:i},this.options.animationDuration,this.options.animationEasing)}},{key:"reflow",value:function(){this.calcPoints(),this._updateActive()}},{key:"_updateActive",value:function(){var t,e=parseInt(window.pageYOffset,10);if(e+this.winHeight===this.docHeight)t=this.points.length-1;else if(e<this.points[0])t=0;else{var i=this.scrollPos<e,n=this,s=this.points.filter(function(t,s){return i?t-n.options.barOffset<=e:t-n.options.barOffset-n.options.threshold<=e});t=s.length?s.length-1:0}if(this.$active.removeClass(this.options.activeClass),this.$active=this.$links.eq(t).addClass(this.options.activeClass),this.options.deepLinking){var o=this.$active[0].getAttribute("href");window.history.pushState?window.history.pushState(null,null,o):window.location.hash=o}this.scrollPos=e,this.$element.trigger("update.zf.magellan",[this.$active])}},{key:"destroy",value:function(){if(this.$element.off(".zf.trigger .zf.magellan").find("."+this.options.activeClass).removeClass(this.options.activeClass),this.options.deepLinking){var t=this.$active[0].getAttribute("href");window.location.hash.replace(t,"")}Foundation.unregisterPlugin(this)}}]),e}();e.defaults={animationDuration:500,animationEasing:"linear",threshold:50,activeClass:"active",deepLinking:!1,barOffset:0},Foundation.plugin(e,"Magellan")}(jQuery);var _createClass=function(){function t(t,e){for(var i=0;i<e.length;i++){var n=e[i];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,n.key,n)}}return function(e,i,n){return i&&t(e.prototype,i),n&&t(e,n),e}}();!function(t){var e=function(){function e(i,n){_classCallCheck(this,e),this.$element=t(i),this.rules=this.$element.data("responsive-menu"),this.currentMq=null,this.currentPlugin=null,this._init(),this._events(),Foundation.registerPlugin(this,"ResponsiveMenu")}return _createClass(e,[{key:"_init",value:function(){if("string"==typeof this.rules){for(var e={},n=this.rules.split(" "),s=0;s<n.length;s++){var o=n[s].split("-"),a=o.length>1?o[0]:"small",r=o.length>1?o[1]:o[0];null!==i[r]&&(e[a]=i[r])}this.rules=e}t.isEmptyObject(this.rules)||this._checkMediaQueries()}},{key:"_events",value:function(){var e=this;t(window).on("changed.zf.mediaquery",function(){e._checkMediaQueries()})}},{key:"_checkMediaQueries",value:function(){var e,n=this;t.each(this.rules,function(t){Foundation.MediaQuery.atLeast(t)&&(e=t)}),e&&(this.currentPlugin instanceof this.rules[e].plugin||(t.each(i,function(t,e){n.$element.removeClass(e.cssClass)}),this.$element.addClass(this.rules[e].cssClass),this.currentPlugin&&this.currentPlugin.destroy(),this.currentPlugin=new this.rules[e].plugin(this.$element,{})))}},{key:"destroy",value:function(){this.currentPlugin.destroy(),t(window).off(".zf.ResponsiveMenu"),Foundation.unregisterPlugin(this)}}]),e}();e.defaults={};var i={dropdown:{cssClass:"dropdown",plugin:Foundation._plugins["dropdown-menu"]||null},drilldown:{cssClass:"drilldown",plugin:Foundation._plugins.drilldown||null},accordion:{cssClass:"accordion-menu",plugin:Foundation._plugins["accordion-menu"]||null}};Foundation.plugin(e,"ResponsiveMenu")}(jQuery);var _createClass=function(){function t(t,e){for(var i=0;i<e.length;i++){var n=e[i];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,n.key,n)}}return function(e,i,n){return i&&t(e.prototype,i),n&&t(e,n),e}}();!function(t){var e=function(){function e(i,n){_classCallCheck(this,e),this.$element=i,this.options=t.extend({},e.defaults,this.$element.data(),n),this._init(),Foundation.registerPlugin(this,"Accordion"),Foundation.Keyboard.register("Accordion",{ENTER:"toggle",SPACE:"toggle",ARROW_DOWN:"next",ARROW_UP:"previous"})}return _createClass(e,[{key:"_init",value:function(){this.$element.attr("role","tablist"),this.$tabs=this.$element.children("li, [data-accordion-item]"),this.$tabs.each(function(e,i){var n=t(i),s=n.children("[data-tab-content]"),o=s[0].id||Foundation.GetYoDigits(6,"accordion"),a=i.id||o+"-label";n.find("a:first").attr({"aria-controls":o,role:"tab",id:a,"aria-expanded":!1,"aria-selected":!1}),s.attr({role:"tabpanel","aria-labelledby":a,"aria-hidden":!0,id:o})});var e=this.$element.find(".is-active").children("[data-tab-content]");e.length&&this.down(e,!0),this._events()}},{key:"_events",value:function(){var e=this;this.$tabs.each(function(){var i=t(this),n=i.children("[data-tab-content]");n.length&&i.children("a").off("click.zf.accordion keydown.zf.accordion").on("click.zf.accordion",function(t){t.preventDefault(),i.hasClass("is-active")?(e.options.allowAllClosed||i.siblings().hasClass("is-active"))&&e.up(n):e.down(n)}).on("keydown.zf.accordion",function(t){Foundation.Keyboard.handleKey(t,"Accordion",{toggle:function(){e.toggle(n)},next:function(){var t=i.next().find("a").focus();e.options.multiExpand||t.trigger("click.zf.accordion")},previous:function(){var t=i.prev().find("a").focus();e.options.multiExpand||t.trigger("click.zf.accordion")},handled:function(){t.preventDefault(),t.stopPropagation()}})})})}},{key:"toggle",value:function(t){if(t.parent().hasClass("is-active")){if(!this.options.allowAllClosed&&!t.parent().siblings().hasClass("is-active"))return;this.up(t)}else this.down(t)}},{key:"down",value:function(e,i){var n=this;if(!this.options.multiExpand&&!i){var s=this.$element.children(".is-active").children("[data-tab-content]");s.length&&this.up(s)}e.attr("aria-hidden",!1).parent("[data-tab-content]").addBack().parent().addClass("is-active"),e.slideDown(this.options.slideSpeed,function(){n.$element.trigger("down.zf.accordion",[e])}),t("#"+e.attr("aria-labelledby")).attr({"aria-expanded":!0,"aria-selected":!0})}},{key:"up",value:function(e){var i=e.parent().siblings(),n=this,s=this.options.multiExpand?i.hasClass("is-active"):e.parent().hasClass("is-active");(this.options.allowAllClosed||s)&&(e.slideUp(n.options.slideSpeed,function(){n.$element.trigger("up.zf.accordion",[e])}),e.attr("aria-hidden",!0).parent().removeClass("is-active"),t("#"+e.attr("aria-labelledby")).attr({"aria-expanded":!1,"aria-selected":!1}))}},{key:"destroy",value:function(){this.$element.find("[data-tab-content]").stop(!0).slideUp(0).css("display",""),this.$element.find("a").off(".zf.accordion"),Foundation.unregisterPlugin(this)}}]),e}();e.defaults={slideSpeed:250,multiExpand:!1,allowAllClosed:!1},Foundation.plugin(e,"Accordion")}(jQuery);var _createClass=function(){function t(t,e){for(var i=0;i<e.length;i++){var n=e[i];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,n.key,n)}}return function(e,i,n){return i&&t(e.prototype,i),n&&t(e,n),e}}();!function(t){var e=function(){function e(i,n){_classCallCheck(this,e),this.$element=i,this.options=t.extend({},e.defaults,this.$element.data(),n),this._init(),Foundation.registerPlugin(this,"Dropdown"),Foundation.Keyboard.register("Dropdown",{ENTER:"open",SPACE:"open",ESCAPE:"close",TAB:"tab_forward",SHIFT_TAB:"tab_backward"})}return _createClass(e,[{key:"_init",value:function(){var e=this.$element.attr("id");this.$anchor=t('[data-toggle="'+e+'"]')||t('[data-open="'+e+'"]'),this.$anchor.attr({"aria-controls":e,"data-is-focus":!1,"data-yeti-box":e,"aria-haspopup":!0,"aria-expanded":!1}),this.options.positionClass=this.getPositionClass(),this.counter=4,this.usedPositions=[],this.$element.attr({"aria-hidden":"true","data-yeti-box":e,"data-resize":e,"aria-labelledby":this.$anchor[0].id||Foundation.GetYoDigits(6,"dd-anchor")}),this._events()}},{key:"getPositionClass",value:function(){var t=this.$element[0].className.match(/(top|left|right|bottom)/g);t=t?t[0]:"";var e=/float-(\S+)\s/.exec(this.$anchor[0].className);e=e?e[1]:"";var i=e?e+" "+t:t;return i}},{key:"_reposition",value:function(t){this.usedPositions.push(t?t:"bottom"),!t&&this.usedPositions.indexOf("top")<0?this.$element.addClass("top"):"top"===t&&this.usedPositions.indexOf("bottom")<0?this.$element.removeClass(t):"left"===t&&this.usedPositions.indexOf("right")<0?this.$element.removeClass(t).addClass("right"):"right"===t&&this.usedPositions.indexOf("left")<0?this.$element.removeClass(t).addClass("left"):!t&&this.usedPositions.indexOf("top")>-1&&this.usedPositions.indexOf("left")<0?this.$element.addClass("left"):"top"===t&&this.usedPositions.indexOf("bottom")>-1&&this.usedPositions.indexOf("left")<0?this.$element.removeClass(t).addClass("left"):"left"===t&&this.usedPositions.indexOf("right")>-1&&this.usedPositions.indexOf("bottom")<0?this.$element.removeClass(t):"right"===t&&this.usedPositions.indexOf("left")>-1&&this.usedPositions.indexOf("bottom")<0?this.$element.removeClass(t):this.$element.removeClass(t),this.classChanged=!0,this.counter--}},{key:"_setPosition",value:function(){if("false"===this.$anchor.attr("aria-expanded"))return!1;var t=this.getPositionClass(),e=Foundation.Box.GetDimensions(this.$element),i=(Foundation.Box.GetDimensions(this.$anchor),"left"===t?"left":"right"===t?"left":"top"),n="top"===i?"height":"width";"height"===n?this.options.vOffset:this.options.hOffset;if(e.width>=e.windowDims.width||!this.counter&&!Foundation.Box.ImNotTouchingYou(this.$element))return this.$element.offset(Foundation.Box.GetOffsets(this.$element,this.$anchor,"center bottom",this.options.vOffset,this.options.hOffset,!0)).css({width:e.windowDims.width-2*this.options.hOffset,height:"auto"}),this.classChanged=!0,!1;for(this.$element.offset(Foundation.Box.GetOffsets(this.$element,this.$anchor,t,this.options.vOffset,this.options.hOffset));!Foundation.Box.ImNotTouchingYou(this.$element,!1,!0)&&this.counter;)this._reposition(t),this._setPosition()}},{key:"_events",value:function(){var e=this;this.$element.on({"open.zf.trigger":this.open.bind(this),"close.zf.trigger":this.close.bind(this),"toggle.zf.trigger":this.toggle.bind(this),"resizeme.zf.trigger":this._setPosition.bind(this)}),this.options.hover&&(this.$anchor.off("mouseenter.zf.dropdown mouseleave.zf.dropdown").on("mouseenter.zf.dropdown",function(){clearTimeout(e.timeout),e.timeout=setTimeout(function(){e.open(),e.$anchor.data("hover",!0)},e.options.hoverDelay)}).on("mouseleave.zf.dropdown",function(){clearTimeout(e.timeout),e.timeout=setTimeout(function(){e.close(),e.$anchor.data("hover",!1)},e.options.hoverDelay)}),this.options.hoverPane&&this.$element.off("mouseenter.zf.dropdown mouseleave.zf.dropdown").on("mouseenter.zf.dropdown",function(){clearTimeout(e.timeout)}).on("mouseleave.zf.dropdown",function(){clearTimeout(e.timeout),e.timeout=setTimeout(function(){e.close(),e.$anchor.data("hover",!1)},e.options.hoverDelay)})),this.$anchor.add(this.$element).on("keydown.zf.dropdown",function(i){var n=t(this),s=Foundation.Keyboard.findFocusable(e.$element);Foundation.Keyboard.handleKey(i,"Dropdown",{tab_forward:function(){e.$element.find(":focus").is(s.eq(-1))&&(e.options.trapFocus?(s.eq(0).focus(),i.preventDefault()):e.close())},tab_backward:function(){(e.$element.find(":focus").is(s.eq(0))||e.$element.is(":focus"))&&(e.options.trapFocus?(s.eq(-1).focus(),i.preventDefault()):e.close())},open:function(){n.is(e.$anchor)&&(e.open(),e.$element.attr("tabindex",-1).focus(),i.preventDefault())},close:function(){e.close(),e.$anchor.focus()}})})}},{key:"_addBodyHandler",value:function(){var e=t(document.body).not(this.$element),i=this;e.off("click.zf.dropdown").on("click.zf.dropdown",function(t){i.$anchor.is(t.target)||i.$anchor.find(t.target).length||i.$element.find(t.target).length||(i.close(),e.off("click.zf.dropdown"))})}},{key:"open",value:function(){if(this.$element.trigger("closeme.zf.dropdown",this.$element.attr("id")),this.$anchor.addClass("hover").attr({"aria-expanded":!0}),this._setPosition(),this.$element.addClass("is-open").attr({"aria-hidden":!1}),this.options.autoFocus){var t=Foundation.Keyboard.findFocusable(this.$element);t.length&&t.eq(0).focus()}this.options.closeOnClick&&this._addBodyHandler(),this.$element.trigger("show.zf.dropdown",[this.$element])}},{key:"close",value:function(){if(!this.$element.hasClass("is-open"))return!1;if(this.$element.removeClass("is-open").attr({"aria-hidden":!0}),this.$anchor.removeClass("hover").attr("aria-expanded",!1),this.classChanged){var t=this.getPositionClass();t&&this.$element.removeClass(t),this.$element.addClass(this.options.positionClass).css({height:"",width:""}),this.classChanged=!1,this.counter=4,this.usedPositions.length=0}this.$element.trigger("hide.zf.dropdown",[this.$element])}},{key:"toggle",value:function(){if(this.$element.hasClass("is-open")){if(this.$anchor.data("hover"))return;this.close()}else this.open()}},{key:"destroy",value:function(){this.$element.off(".zf.trigger").hide(),this.$anchor.off(".zf.dropdown"),Foundation.unregisterPlugin(this)}}]),e}();e.defaults={hoverDelay:250,hover:!1,hoverPane:!1,vOffset:1,hOffset:1,positionClass:"",trapFocus:!1,autoFocus:!1,closeOnClick:!1},Foundation.plugin(e,"Dropdown")}(jQuery);var _createClass=function(){function t(t,e){for(var i=0;i<e.length;i++){var n=e[i];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,n.key,n)}}return function(e,i,n){return i&&t(e.prototype,i),n&&t(e,n),e}}();!function(t){var e=function(){function e(i,n){_classCallCheck(this,e),this.$element=i,this.options=t.extend({},e.defaults,this.$element.data(),n),this.$lastTrigger=t(),this.$triggers=t(),this._init(),this._events(),Foundation.registerPlugin(this,"OffCanvas")}return _createClass(e,[{key:"_init",value:function(){var e=this.$element.attr("id");if(this.$element.attr("aria-hidden","true"),this.$triggers=t(document).find('[data-open="'+e+'"], [data-close="'+e+'"], [data-toggle="'+e+'"]').attr("aria-expanded","false").attr("aria-controls",e),this.options.closeOnClick)if(t(".js-off-canvas-exit").length)this.$exiter=t(".js-off-canvas-exit");else{var i=document.createElement("div");i.setAttribute("class","js-off-canvas-exit"),t("[data-off-canvas-content]").append(i),this.$exiter=t(i)}this.options.isRevealed=this.options.isRevealed||new RegExp(this.options.revealClass,"g").test(this.$element[0].className),this.options.isRevealed&&(this.options.revealOn=this.options.revealOn||this.$element[0].className.match(/(reveal-for-medium|reveal-for-large)/g)[0].split("-")[2],this._setMQChecker()),this.options.transitionTime||(this.options.transitionTime=1e3*parseFloat(window.getComputedStyle(t("[data-off-canvas-wrapper]")[0]).transitionDuration))}},{key:"_events",value:function(){this.$element.off(".zf.trigger .zf.offcanvas").on({"open.zf.trigger":this.open.bind(this),"close.zf.trigger":this.close.bind(this),"toggle.zf.trigger":this.toggle.bind(this),"keydown.zf.offcanvas":this._handleKeyboard.bind(this)}),this.options.closeOnClick&&this.$exiter.length&&this.$exiter.on({"click.zf.offcanvas":this.close.bind(this)})}},{key:"_setMQChecker",value:function(){var e=this;t(window).on("changed.zf.mediaquery",function(){Foundation.MediaQuery.atLeast(e.options.revealOn)?e.reveal(!0):e.reveal(!1)}).one("load.zf.offcanvas",function(){Foundation.MediaQuery.atLeast(e.options.revealOn)&&e.reveal(!0)})}},{key:"reveal",value:function(t){var e=this.$element.find("[data-close]");t?(this.close(),this.isRevealed=!0,this.$element.off("open.zf.trigger toggle.zf.trigger"),e.length&&e.hide()):(this.isRevealed=!1,this.$element.on({"open.zf.trigger":this.open.bind(this),"toggle.zf.trigger":this.toggle.bind(this)}),e.length&&e.show())}},{key:"open",value:function(e,i){if(!this.$element.hasClass("is-open")&&!this.isRevealed){var n=this;t(document.body);this.options.forceTop&&t("body").scrollTop(0),Foundation.Move(this.options.transitionTime,this.$element,function(){t("[data-off-canvas-wrapper]").addClass("is-off-canvas-open is-open-"+n.options.position),n.$element.addClass("is-open")}),this.$triggers.attr("aria-expanded","true"),this.$element.attr("aria-hidden","false").trigger("opened.zf.offcanvas"),this.options.closeOnClick&&this.$exiter.addClass("is-visible"),i&&(this.$lastTrigger=i),this.options.autoFocus&&this.$element.one(Foundation.transitionend(this.$element),function(){n.$element.find("a, button").eq(0).focus()}),this.options.trapFocus&&(t("[data-off-canvas-content]").attr("tabindex","-1"),this._trapFocus())}}},{key:"_trapFocus",value:function(){var t=Foundation.Keyboard.findFocusable(this.$element),e=t.eq(0),i=t.eq(-1);t.off(".zf.offcanvas").on("keydown.zf.offcanvas",function(t){9!==t.which&&9!==t.keycode||(t.target!==i[0]||t.shiftKey||(t.preventDefault(),e.focus()),t.target===e[0]&&t.shiftKey&&(t.preventDefault(),i.focus()))})}},{key:"close",value:function(e){if(this.$element.hasClass("is-open")&&!this.isRevealed){var i=this;t("[data-off-canvas-wrapper]").removeClass("is-off-canvas-open is-open-"+i.options.position),i.$element.removeClass("is-open"),this.$element.attr("aria-hidden","true").trigger("closed.zf.offcanvas"),this.options.closeOnClick&&this.$exiter.removeClass("is-visible"),this.$triggers.attr("aria-expanded","false"),this.options.trapFocus&&t("[data-off-canvas-content]").removeAttr("tabindex")}}},{key:"toggle",value:function(t,e){this.$element.hasClass("is-open")?this.close(t,e):this.open(t,e)}},{key:"_handleKeyboard",value:function(t){27===t.which&&(t.stopPropagation(),t.preventDefault(),this.close(),this.$lastTrigger.focus())}},{key:"destroy",value:function(){this.close(),this.$element.off(".zf.trigger .zf.offcanvas"),this.$exiter.off(".zf.offcanvas"),Foundation.unregisterPlugin(this)}}]),e}();e.defaults={closeOnClick:!0,transitionTime:0,position:"left",forceTop:!0,isRevealed:!1,revealOn:null,autoFocus:!0,revealClass:"reveal-for-",trapFocus:!1},Foundation.plugin(e,"OffCanvas")}(jQuery);var _createClass=function(){function t(t,e){for(var i=0;i<e.length;i++){var n=e[i];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,n.key,n)}}return function(e,i,n){return i&&t(e.prototype,i),n&&t(e,n),e}}();!function(t){var e=function(){function e(i,n){_classCallCheck(this,e),this.$element=i,this.options=t.extend({},e.defaults,this.$element.data(),n),this._init(),Foundation.registerPlugin(this,"Tabs"),Foundation.Keyboard.register("Tabs",{ENTER:"open",SPACE:"open",ARROW_RIGHT:"next",ARROW_UP:"previous",ARROW_DOWN:"next",ARROW_LEFT:"previous"})}return _createClass(e,[{key:"_init",value:function(){var e=this;if(this.$tabTitles=this.$element.find("."+this.options.linkClass),this.$tabContent=t('[data-tabs-content="'+this.$element[0].id+'"]'),this.$tabTitles.each(function(){var i=t(this),n=i.find("a"),s=i.hasClass("is-active"),o=n[0].hash.slice(1),a=n[0].id?n[0].id:o+"-label",r=t("#"+o);i.attr({role:"presentation"}),n.attr({role:"tab","aria-controls":o,"aria-selected":s,id:a}),r.attr({role:"tabpanel","aria-hidden":!s,"aria-labelledby":a}),s&&e.options.autoFocus&&n.focus()}),this.options.matchHeight){var i=this.$tabContent.find("img");i.length?Foundation.onImagesLoaded(i,this._setHeight.bind(this)):this._setHeight()}this._events()}},{key:"_events",value:function(){this._addKeyHandler(),this._addClickHandler(),this._setHeightMqHandler=null,this.options.matchHeight&&(this._setHeightMqHandler=this._setHeight.bind(this),t(window).on("changed.zf.mediaquery",this._setHeightMqHandler))}},{key:"_addClickHandler",value:function(){var e=this;this.$element.off("click.zf.tabs").on("click.zf.tabs","."+this.options.linkClass,function(i){i.preventDefault(),i.stopPropagation(),t(this).hasClass("is-active")||e._handleTabChange(t(this))})}},{key:"_addKeyHandler",value:function(){var e=this;e.$element.find("li:first-of-type"),e.$element.find("li:last-of-type");this.$tabTitles.off("keydown.zf.tabs").on("keydown.zf.tabs",function(i){if(9!==i.which){var n,s,o=t(this),a=o.parent("ul").children("li");a.each(function(i){return t(this).is(o)?void(e.options.wrapOnKeys?(n=0===i?a.last():a.eq(i-1),s=i===a.length-1?a.first():a.eq(i+1)):(n=a.eq(Math.max(0,i-1)),s=a.eq(Math.min(i+1,a.length-1)))):void 0}),Foundation.Keyboard.handleKey(i,"Tabs",{open:function(){o.find('[role="tab"]').focus(),e._handleTabChange(o)},previous:function(){n.find('[role="tab"]').focus(),e._handleTabChange(n)},next:function(){s.find('[role="tab"]').focus(),e._handleTabChange(s)},handled:function(){i.stopPropagation(),
i.preventDefault()}})}})}},{key:"_handleTabChange",value:function(e){var i=e.find('[role="tab"]'),n=i[0].hash,s=this.$tabContent.find(n),o=this.$element.find("."+this.options.linkClass+".is-active").removeClass("is-active").find('[role="tab"]').attr({"aria-selected":"false"});t("#"+o.attr("aria-controls")).removeClass("is-active").attr({"aria-hidden":"true"}),e.addClass("is-active"),i.attr({"aria-selected":"true"}),s.addClass("is-active").attr({"aria-hidden":"false"}),this.$element.trigger("change.zf.tabs",[e])}},{key:"selectTab",value:function(t){var e;e="object"==typeof t?t[0].id:t,e.indexOf("#")<0&&(e="#"+e);var i=this.$tabTitles.find('[href="'+e+'"]').parent("."+this.options.linkClass);this._handleTabChange(i)}},{key:"_setHeight",value:function(){var e=0;this.$tabContent.find("."+this.options.panelClass).css("height","").each(function(){var i=t(this),n=i.hasClass("is-active");n||i.css({visibility:"hidden",display:"block"});var s=this.getBoundingClientRect().height;n||i.css({visibility:"",display:""}),e=s>e?s:e}).css("height",e+"px")}},{key:"destroy",value:function(){this.$element.find("."+this.options.linkClass).off(".zf.tabs").hide().end().find("."+this.options.panelClass).hide(),this.options.matchHeight&&null!=this._setHeightMqHandler&&t(window).off("changed.zf.mediaquery",this._setHeightMqHandler),Foundation.unregisterPlugin(this)}}]),e}();e.defaults={autoFocus:!1,wrapOnKeys:!0,matchHeight:!1,linkClass:"tabs-title",panelClass:"tabs-panel"},Foundation.plugin(e,"Tabs")}(jQuery);var _createClass=function(){function t(t,e){for(var i=0;i<e.length;i++){var n=e[i];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,n.key,n)}}return function(e,i,n){return i&&t(e.prototype,i),n&&t(e,n),e}}();!function(t){function e(){return/iP(ad|hone|od).*OS/.test(window.navigator.userAgent)}function i(){return/Android/.test(window.navigator.userAgent)}function n(){return e()||i()}var s=function(){function e(i,n){_classCallCheck(this,e),this.$element=i,this.options=t.extend({},e.defaults,this.$element.data(),n),this._init(),Foundation.registerPlugin(this,"Reveal"),Foundation.Keyboard.register("Reveal",{ENTER:"open",SPACE:"open",ESCAPE:"close",TAB:"tab_forward",SHIFT_TAB:"tab_backward"})}return _createClass(e,[{key:"_init",value:function(){this.id=this.$element.attr("id"),this.isActive=!1,this.cached={mq:Foundation.MediaQuery.current},this.isMobile=n(),this.$anchor=t(t('[data-open="'+this.id+'"]').length?'[data-open="'+this.id+'"]':'[data-toggle="'+this.id+'"]'),this.$anchor.attr({"aria-controls":this.id,"aria-haspopup":!0,tabindex:0}),(this.options.fullScreen||this.$element.hasClass("full"))&&(this.options.fullScreen=!0,this.options.overlay=!1),this.options.overlay&&!this.$overlay&&(this.$overlay=this._makeOverlay(this.id)),this.$element.attr({role:"dialog","aria-hidden":!0,"data-yeti-box":this.id,"data-resize":this.id}),this.$overlay?this.$element.detach().appendTo(this.$overlay):(this.$element.detach().appendTo(t("body")),this.$element.addClass("without-overlay")),this._events(),this.options.deepLink&&window.location.hash==="#"+this.id&&t(window).one("load.zf.reveal",this.open.bind(this))}},{key:"_makeOverlay",value:function(e){var i=t("<div></div>").addClass("reveal-overlay").appendTo("body");return i}},{key:"_updatePosition",value:function(){var e,i,n=this.$element.outerWidth(),s=t(window).width(),o=this.$element.outerHeight(),a=t(window).height();e="auto"===this.options.hOffset?parseInt((s-n)/2,10):parseInt(this.options.hOffset,10),i="auto"===this.options.vOffset?o>a?parseInt(Math.min(100,a/10),10):parseInt((a-o)/4,10):parseInt(this.options.vOffset,10),this.$element.css({top:i+"px"}),this.$overlay&&"auto"===this.options.hOffset||(this.$element.css({left:e+"px"}),this.$element.css({margin:"0px"}))}},{key:"_events",value:function(){var e=this,i=this;this.$element.on({"open.zf.trigger":this.open.bind(this),"close.zf.trigger":function(n,s){return n.target===i.$element[0]||t(n.target).parents("[data-closable]")[0]===s?e.close.apply(e):void 0},"toggle.zf.trigger":this.toggle.bind(this),"resizeme.zf.trigger":function(){i._updatePosition()}}),this.$anchor.length&&this.$anchor.on("keydown.zf.reveal",function(t){13!==t.which&&32!==t.which||(t.stopPropagation(),t.preventDefault(),i.open())}),this.options.closeOnClick&&this.options.overlay&&this.$overlay.off(".zf.reveal").on("click.zf.reveal",function(e){e.target===i.$element[0]||t.contains(i.$element[0],e.target)||i.close()}),this.options.deepLink&&t(window).on("popstate.zf.reveal:"+this.id,this._handleState.bind(this))}},{key:"_handleState",value:function(t){window.location.hash!=="#"+this.id||this.isActive?this.close():this.open()}},{key:"open",value:function(){var e=this;if(this.options.deepLink){var i="#"+this.id;window.history.pushState?window.history.pushState(null,null,i):window.location.hash=i}if(this.isActive=!0,this.$element.css({visibility:"hidden"}).show().scrollTop(0),this.options.overlay&&this.$overlay.css({visibility:"hidden"}).show(),this._updatePosition(),this.$element.hide().css({visibility:""}),this.$overlay&&(this.$overlay.css({visibility:""}).hide(),this.$element.hasClass("fast")?this.$overlay.addClass("fast"):this.$element.hasClass("slow")&&this.$overlay.addClass("slow")),this.options.multipleOpened||this.$element.trigger("closeme.zf.reveal",this.id),this.options.animationIn){var n;!function(){var t=function(){n.$element.attr({"aria-hidden":!1,tabindex:-1}).focus(),console.log("focus")};n=e,e.options.overlay&&Foundation.Motion.animateIn(e.$overlay,"fade-in"),Foundation.Motion.animateIn(e.$element,e.options.animationIn,function(){e.focusableElements=Foundation.Keyboard.findFocusable(e.$element),t()})}()}else this.options.overlay&&this.$overlay.show(0),this.$element.show(this.options.showDelay);this.$element.attr({"aria-hidden":!1,tabindex:-1}).focus(),this.$element.trigger("open.zf.reveal"),this.isMobile?(this.originalScrollPos=window.pageYOffset,t("html, body").addClass("is-reveal-open")):t("body").addClass("is-reveal-open"),setTimeout(function(){e._extraHandlers()},0)}},{key:"_extraHandlers",value:function(){var e=this;this.focusableElements=Foundation.Keyboard.findFocusable(this.$element),this.options.overlay||!this.options.closeOnClick||this.options.fullScreen||t("body").on("click.zf.reveal",function(i){i.target===e.$element[0]||t.contains(e.$element[0],i.target)||e.close()}),this.options.closeOnEsc&&t(window).on("keydown.zf.reveal",function(t){Foundation.Keyboard.handleKey(t,"Reveal",{close:function(){e.options.closeOnEsc&&(e.close(),e.$anchor.focus())}})}),this.$element.on("keydown.zf.reveal",function(i){var n=t(this);Foundation.Keyboard.handleKey(i,"Reveal",{tab_forward:function(){return e.$element.find(":focus").is(e.focusableElements.eq(-1))?(e.focusableElements.eq(0).focus(),!0):0===e.focusableElements.length?!0:void 0},tab_backward:function(){return e.$element.find(":focus").is(e.focusableElements.eq(0))||e.$element.is(":focus")?(e.focusableElements.eq(-1).focus(),!0):0===e.focusableElements.length?!0:void 0},open:function(){e.$element.find(":focus").is(e.$element.find("[data-close]"))?setTimeout(function(){e.$anchor.focus()},1):n.is(e.focusableElements)&&e.open()},close:function(){e.options.closeOnEsc&&(e.close(),e.$anchor.focus())},handled:function(t){t&&i.preventDefault()}})})}},{key:"close",value:function(){function e(){i.isMobile?(t("html, body").removeClass("is-reveal-open"),i.originalScrollPos&&(t("body").scrollTop(i.originalScrollPos),i.originalScrollPos=null)):t("body").removeClass("is-reveal-open"),i.$element.attr("aria-hidden",!0),i.$element.trigger("closed.zf.reveal")}if(!this.isActive||!this.$element.is(":visible"))return!1;var i=this;this.options.animationOut?(this.options.overlay?Foundation.Motion.animateOut(this.$overlay,"fade-out",e):e(),Foundation.Motion.animateOut(this.$element,this.options.animationOut)):(this.options.overlay?this.$overlay.hide(0,e):e(),this.$element.hide(this.options.hideDelay)),this.options.closeOnEsc&&t(window).off("keydown.zf.reveal"),!this.options.overlay&&this.options.closeOnClick&&t("body").off("click.zf.reveal"),this.$element.off("keydown.zf.reveal"),this.options.resetOnClose&&this.$element.html(this.$element.html()),this.isActive=!1,i.options.deepLink&&(window.history.replaceState?window.history.replaceState("",document.title,window.location.pathname):window.location.hash="")}},{key:"toggle",value:function(){this.isActive?this.close():this.open()}},{key:"destroy",value:function(){this.options.overlay&&(this.$element.appendTo(t("body")),this.$overlay.hide().off().remove()),this.$element.hide().off(),this.$anchor.off(".zf"),t(window).off(".zf.reveal:"+this.id),Foundation.unregisterPlugin(this)}}]),e}();s.defaults={animationIn:"",animationOut:"",showDelay:0,hideDelay:0,closeOnClick:!0,closeOnEsc:!0,multipleOpened:!1,vOffset:"auto",hOffset:"auto",fullScreen:!1,btmOffsetPct:10,overlay:!0,resetOnClose:!1,deepLink:!1},Foundation.plugin(s,"Reveal")}(jQuery);var _createClass=function(){function t(t,e){for(var i=0;i<e.length;i++){var n=e[i];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,n.key,n)}}return function(e,i,n){return i&&t(e.prototype,i),n&&t(e,n),e}}();!function(t){var e=function(){function e(i,n){_classCallCheck(this,e),this.$element=i,this.options=t.extend({},e.defaults,this.$element.data(),n),this.isActive=!1,this.isClick=!1,this._init(),Foundation.registerPlugin(this,"Tooltip")}return _createClass(e,[{key:"_init",value:function(){var e=this.$element.attr("aria-describedby")||Foundation.GetYoDigits(6,"tooltip");this.options.positionClass=this.options.positionClass||this._getPositionClass(this.$element),this.options.tipText=this.options.tipText||this.$element.attr("title"),this.template=this.options.template?t(this.options.template):this._buildTemplate(e),this.template.appendTo(document.body).text(this.options.tipText).hide(),this.$element.attr({title:"","aria-describedby":e,"data-yeti-box":e,"data-toggle":e,"data-resize":e}).addClass(this.triggerClass),this.usedPositions=[],this.counter=4,this.classChanged=!1,this._events()}},{key:"_getPositionClass",value:function(t){if(!t)return"";var e=t[0].className.match(/\b(top|left|right)\b/g);return e=e?e[0]:""}},{key:"_buildTemplate",value:function(e){var i=(this.options.tooltipClass+" "+this.options.positionClass+" "+this.options.templateClasses).trim(),n=t("<div></div>").addClass(i).attr({role:"tooltip","aria-hidden":!0,"data-is-active":!1,"data-is-focus":!1,id:e});return n}},{key:"_reposition",value:function(t){this.usedPositions.push(t?t:"bottom"),!t&&this.usedPositions.indexOf("top")<0?this.template.addClass("top"):"top"===t&&this.usedPositions.indexOf("bottom")<0?this.template.removeClass(t):"left"===t&&this.usedPositions.indexOf("right")<0?this.template.removeClass(t).addClass("right"):"right"===t&&this.usedPositions.indexOf("left")<0?this.template.removeClass(t).addClass("left"):!t&&this.usedPositions.indexOf("top")>-1&&this.usedPositions.indexOf("left")<0?this.template.addClass("left"):"top"===t&&this.usedPositions.indexOf("bottom")>-1&&this.usedPositions.indexOf("left")<0?this.template.removeClass(t).addClass("left"):"left"===t&&this.usedPositions.indexOf("right")>-1&&this.usedPositions.indexOf("bottom")<0?this.template.removeClass(t):"right"===t&&this.usedPositions.indexOf("left")>-1&&this.usedPositions.indexOf("bottom")<0?this.template.removeClass(t):this.template.removeClass(t),this.classChanged=!0,this.counter--}},{key:"_setPosition",value:function(){var t=this._getPositionClass(this.template),e=Foundation.Box.GetDimensions(this.template),i=Foundation.Box.GetDimensions(this.$element),n="left"===t?"left":"right"===t?"left":"top",s="top"===n?"height":"width";"height"===s?this.options.vOffset:this.options.hOffset;if(e.width>=e.windowDims.width||!this.counter&&!Foundation.Box.ImNotTouchingYou(this.template))return this.template.offset(Foundation.Box.GetOffsets(this.template,this.$element,"center bottom",this.options.vOffset,this.options.hOffset,!0)).css({width:i.windowDims.width-2*this.options.hOffset,height:"auto"}),!1;for(this.template.offset(Foundation.Box.GetOffsets(this.template,this.$element,"center "+(t||"bottom"),this.options.vOffset,this.options.hOffset));!Foundation.Box.ImNotTouchingYou(this.template)&&this.counter;)this._reposition(t),this._setPosition()}},{key:"show",value:function(){if("all"!==this.options.showOn&&!Foundation.MediaQuery.atLeast(this.options.showOn))return!1;var t=this;this.template.css("visibility","hidden").show(),this._setPosition(),this.$element.trigger("closeme.zf.tooltip",this.template.attr("id")),this.template.attr({"data-is-active":!0,"aria-hidden":!1}),t.isActive=!0,this.template.stop().hide().css("visibility","").fadeIn(this.options.fadeInDuration,function(){}),this.$element.trigger("show.zf.tooltip")}},{key:"hide",value:function(){var t=this;this.template.stop().attr({"aria-hidden":!0,"data-is-active":!1}).fadeOut(this.options.fadeOutDuration,function(){t.isActive=!1,t.isClick=!1,t.classChanged&&(t.template.removeClass(t._getPositionClass(t.template)).addClass(t.options.positionClass),t.usedPositions=[],t.counter=4,t.classChanged=!1)}),this.$element.trigger("hide.zf.tooltip")}},{key:"_events",value:function(){var t=this,e=(this.template,!1);this.options.disableHover||this.$element.on("mouseenter.zf.tooltip",function(e){t.isActive||(t.timeout=setTimeout(function(){t.show()},t.options.hoverDelay))}).on("mouseleave.zf.tooltip",function(i){clearTimeout(t.timeout),(!e||t.isClick&&!t.options.clickOpen)&&t.hide()}),this.options.clickOpen?this.$element.on("mousedown.zf.tooltip",function(e){e.stopImmediatePropagation(),t.isClick||(t.isClick=!0,!t.options.disableHover&&t.$element.attr("tabindex")||t.isActive||t.show())}):this.$element.on("mousedown.zf.tooltip",function(e){e.stopImmediatePropagation(),t.isClick=!0}),this.options.disableForTouch||this.$element.on("tap.zf.tooltip touchend.zf.tooltip",function(e){t.isActive?t.hide():t.show()}),this.$element.on({"close.zf.trigger":this.hide.bind(this)}),this.$element.on("focus.zf.tooltip",function(i){return e=!0,t.isClick?(t.options.clickOpen||(e=!1),!1):void t.show()}).on("focusout.zf.tooltip",function(i){e=!1,t.isClick=!1,t.hide()}).on("resizeme.zf.trigger",function(){t.isActive&&t._setPosition()})}},{key:"toggle",value:function(){this.isActive?this.hide():this.show()}},{key:"destroy",value:function(){this.$element.attr("title",this.template.text()).off(".zf.trigger .zf.tootip").removeAttr("aria-describedby").removeAttr("data-yeti-box").removeAttr("data-toggle").removeAttr("data-resize"),this.template.remove(),Foundation.unregisterPlugin(this)}}]),e}();e.defaults={disableForTouch:!1,hoverDelay:200,fadeInDuration:150,fadeOutDuration:150,disableHover:!1,templateClasses:"",tooltipClass:"tooltip",triggerClass:"has-tip",showOn:"small",template:"",tipText:"",touchCloseText:"Tap to close.",clickOpen:!0,positionClass:"",vOffset:10,hOffset:12},Foundation.plugin(e,"Tooltip")}(jQuery);var _createClass=function(){function t(t,e){for(var i=0;i<e.length;i++){var n=e[i];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,n.key,n)}}return function(e,i,n){return i&&t(e.prototype,i),n&&t(e,n),e}}();!function(t){var e=function(){function e(i,n){_classCallCheck(this,e),this.$element=i,this.options=t.extend({},e.defaults,this.$element.data(),n),this._init(),Foundation.registerPlugin(this,"Orbit"),Foundation.Keyboard.register("Orbit",{ltr:{ARROW_RIGHT:"next",ARROW_LEFT:"previous"},rtl:{ARROW_LEFT:"next",ARROW_RIGHT:"previous"}})}return _createClass(e,[{key:"_init",value:function(){this.$wrapper=this.$element.find("."+this.options.containerClass),this.$slides=this.$element.find("."+this.options.slideClass);var t=this.$element.find("img"),e=this.$slides.filter(".is-active");e.length||this.$slides.eq(0).addClass("is-active"),this.options.useMUI||this.$slides.addClass("no-motionui"),t.length?Foundation.onImagesLoaded(t,this._prepareForOrbit.bind(this)):this._prepareForOrbit(),this.options.bullets&&this._loadBullets(),this._events(),this.options.autoPlay&&this.$slides.length>1&&this.geoSync(),this.options.accessible&&this.$wrapper.attr("tabindex",0)}},{key:"_loadBullets",value:function(){this.$bullets=this.$element.find("."+this.options.boxOfBullets).find("button")}},{key:"geoSync",value:function(){var t=this;this.timer=new Foundation.Timer(this.$element,{duration:this.options.timerDelay,infinite:!1},function(){t.changeSlide(!0)}),this.timer.start()}},{key:"_prepareForOrbit",value:function(){var t=this;this._setWrapperHeight(function(e){t._setSlideHeight(e)})}},{key:"_setWrapperHeight",value:function(e){var i,n=0,s=0;this.$slides.each(function(){i=this.getBoundingClientRect().height,t(this).attr("data-slide",s),s&&t(this).css({position:"relative",display:"none"}),n=i>n?i:n,s++}),s===this.$slides.length&&(this.$wrapper.css({height:n}),e(n))}},{key:"_setSlideHeight",value:function(e){this.$slides.each(function(){t(this).css("max-height",e)})}},{key:"_events",value:function(){var e=this;if(this.$slides.length>1){if(this.options.swipe&&this.$slides.off("swipeleft.zf.orbit swiperight.zf.orbit").on("swipeleft.zf.orbit",function(t){t.preventDefault(),e.changeSlide(!0)}).on("swiperight.zf.orbit",function(t){t.preventDefault(),e.changeSlide(!1)}),this.options.autoPlay&&(this.$slides.on("click.zf.orbit",function(){e.$element.data("clickedOn",!e.$element.data("clickedOn")),e.timer[e.$element.data("clickedOn")?"pause":"start"]()}),this.options.pauseOnHover&&this.$element.on("mouseenter.zf.orbit",function(){e.timer.pause()}).on("mouseleave.zf.orbit",function(){e.$element.data("clickedOn")||e.timer.start()})),this.options.navButtons){var i=this.$element.find("."+this.options.nextClass+", ."+this.options.prevClass);i.attr("tabindex",0).on("click.zf.orbit touchend.zf.orbit",function(i){i.preventDefault(),e.changeSlide(t(this).hasClass(e.options.nextClass))})}this.options.bullets&&this.$bullets.on("click.zf.orbit touchend.zf.orbit",function(){if(/is-active/g.test(this.className))return!1;var i=t(this).data("slide"),n=i>e.$slides.filter(".is-active").data("slide"),s=e.$slides.eq(i);e.changeSlide(n,s,i)}),this.$wrapper.add(this.$bullets).on("keydown.zf.orbit",function(i){Foundation.Keyboard.handleKey(i,"Orbit",{next:function(){e.changeSlide(!0)},previous:function(){e.changeSlide(!1)},handled:function(){t(i.target).is(e.$bullets)&&e.$bullets.filter(".is-active").focus()}})})}}},{key:"changeSlide",value:function(t,e,i){var n=this.$slides.filter(".is-active").eq(0);if(/mui/g.test(n[0].className))return!1;var s,o=this.$slides.first(),a=this.$slides.last(),r=t?"Right":"Left",l=t?"Left":"Right",u=this;s=e?e:t?this.options.infiniteWrap?n.next("."+this.options.slideClass).length?n.next("."+this.options.slideClass):o:n.next("."+this.options.slideClass):this.options.infiniteWrap?n.prev("."+this.options.slideClass).length?n.prev("."+this.options.slideClass):a:n.prev("."+this.options.slideClass),s.length&&(this.options.bullets&&(i=i||this.$slides.index(s),this._updateBullets(i)),this.options.useMUI?(Foundation.Motion.animateIn(s.addClass("is-active").css({position:"absolute",top:0}),this.options["animInFrom"+r],function(){s.css({position:"relative",display:"block"}).attr("aria-live","polite")}),Foundation.Motion.animateOut(n.removeClass("is-active"),this.options["animOutTo"+l],function(){n.removeAttr("aria-live"),u.options.autoPlay&&!u.timer.isPaused&&u.timer.restart()})):(n.removeClass("is-active is-in").removeAttr("aria-live").hide(),s.addClass("is-active is-in").attr("aria-live","polite").show(),this.options.autoPlay&&!this.timer.isPaused&&this.timer.restart()),this.$element.trigger("slidechange.zf.orbit",[s]))}},{key:"_updateBullets",value:function(t){var e=this.$element.find("."+this.options.boxOfBullets).find(".is-active").removeClass("is-active").blur(),i=e.find("span:last").detach();this.$bullets.eq(t).addClass("is-active").append(i)}},{key:"destroy",value:function(){this.$element.off(".zf.orbit").find("*").off(".zf.orbit").end().hide(),Foundation.unregisterPlugin(this)}}]),e}();e.defaults={bullets:!0,navButtons:!0,animInFromRight:"slide-in-right",animOutToRight:"slide-out-right",animInFromLeft:"slide-in-left",animOutToLeft:"slide-out-left",autoPlay:!0,timerDelay:5e3,infiniteWrap:!0,swipe:!0,pauseOnHover:!0,accessible:!0,containerClass:"orbit-container",slideClass:"orbit-slide",boxOfBullets:"orbit-bullets",nextClass:"orbit-next",prevClass:"orbit-previous",useMUI:!0},Foundation.plugin(e,"Orbit")}(jQuery);var _createClass=function(){function t(t,e){for(var i=0;i<e.length;i++){var n=e[i];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,n.key,n)}}return function(e,i,n){return i&&t(e.prototype,i),n&&t(e,n),e}}();!function(t){function e(t){return parseInt(window.getComputedStyle(document.body,null).fontSize,10)*t}var i=function(){function i(e,n){_classCallCheck(this,i),this.$element=e,this.options=t.extend({},i.defaults,this.$element.data(),n),this._init(),Foundation.registerPlugin(this,"Sticky")}return _createClass(i,[{key:"_init",value:function(){var e=this.$element.parent("[data-sticky-container]"),i=this.$element[0].id||Foundation.GetYoDigits(6,"sticky"),n=this;e.length||(this.wasWrapped=!0),this.$container=e.length?e:t(this.options.container).wrapInner(this.$element),this.$container.addClass(this.options.containerClass),this.$element.addClass(this.options.stickyClass).attr({"data-resize":i}),this.scrollCount=this.options.checkEvery,this.isStuck=!1,t(window).one("load.zf.sticky",function(){""!==n.options.anchor?n.$anchor=t("#"+n.options.anchor):n._parsePoints(),n._setSizes(function(){n._calc(!1)}),n._events(i.split("-").reverse().join("-"))})}},{key:"_parsePoints",value:function(){for(var e=""==this.options.topAnchor?1:this.options.topAnchor,i=""==this.options.btmAnchor?document.documentElement.scrollHeight:this.options.btmAnchor,n=[e,i],s={},o=0,a=n.length;a>o&&n[o];o++){var r;if("number"==typeof n[o])r=n[o];else{var l=n[o].split(":"),u=t("#"+l[0]);r=u.offset().top,l[1]&&"bottom"===l[1].toLowerCase()&&(r+=u[0].getBoundingClientRect().height)}s[o]=r}this.points=s}},{key:"_events",value:function(e){var i=this,n=this.scrollListener="scroll.zf."+e;this.isOn||(this.canStick&&(this.isOn=!0,t(window).off(n).on(n,function(t){0===i.scrollCount?(i.scrollCount=i.options.checkEvery,i._setSizes(function(){i._calc(!1,window.pageYOffset)})):(i.scrollCount--,i._calc(!1,window.pageYOffset))})),this.$element.off("resizeme.zf.trigger").on("resizeme.zf.trigger",function(t,s){i._setSizes(function(){i._calc(!1),i.canStick?i.isOn||i._events(e):i.isOn&&i._pauseListeners(n)})}))}},{key:"_pauseListeners",value:function(e){this.isOn=!1,t(window).off(e),this.$element.trigger("pause.zf.sticky")}},{key:"_calc",value:function(t,e){return t&&this._setSizes(),this.canStick?(e||(e=window.pageYOffset),void(e>=this.topPoint?e<=this.bottomPoint?this.isStuck||this._setSticky():this.isStuck&&this._removeSticky(!1):this.isStuck&&this._removeSticky(!0))):(this.isStuck&&this._removeSticky(!0),!1)}},{key:"_setSticky",value:function(){var t=this,e=this.options.stickTo,i="top"===e?"marginTop":"marginBottom",n="top"===e?"bottom":"top",s={};s[i]=this.options[i]+"em",s[e]=0,s[n]="auto",s.left=this.$container.offset().left+parseInt(window.getComputedStyle(this.$container[0])["padding-left"],10),this.isStuck=!0,this.$element.removeClass("is-anchored is-at-"+n).addClass("is-stuck is-at-"+e).css(s).trigger("sticky.zf.stuckto:"+e),this.$element.on("transitionend webkitTransitionEnd oTransitionEnd otransitionend MSTransitionEnd",function(){t._setSizes()})}},{key:"_removeSticky",value:function(t){var e=this.options.stickTo,i="top"===e,n={},s=(this.points?this.points[1]-this.points[0]:this.anchorHeight)-this.elemHeight,o=i?"marginTop":"marginBottom",a=t?"top":"bottom";n[o]=0,n.bottom="auto",t?n.top=0:n.top=s,n.left="",this.isStuck=!1,this.$element.removeClass("is-stuck is-at-"+e).addClass("is-anchored is-at-"+a).css(n).trigger("sticky.zf.unstuckfrom:"+a)}},{key:"_setSizes",value:function(t){this.canStick=Foundation.MediaQuery.atLeast(this.options.stickyOn),this.canStick||t();var e=this.$container[0].getBoundingClientRect().width,i=window.getComputedStyle(this.$container[0]),n=parseInt(i["padding-right"],10);this.$anchor&&this.$anchor.length?this.anchorHeight=this.$anchor[0].getBoundingClientRect().height:this._parsePoints(),this.$element.css({"max-width":e-n+"px"});var s=this.$element[0].getBoundingClientRect().height||this.containerHeight;"none"==this.$element.css("display")&&(s=0),this.containerHeight=s,this.$container.css({height:s}),this.elemHeight=s,this.isStuck&&this.$element.css({left:this.$container.offset().left+parseInt(i["padding-left"],10)}),this._setBreakPoints(s,function(){t&&t()})}},{key:"_setBreakPoints",value:function(t,i){if(!this.canStick){if(!i)return!1;i()}var n=e(this.options.marginTop),s=e(this.options.marginBottom),o=this.points?this.points[0]:this.$anchor.offset().top,a=this.points?this.points[1]:o+this.anchorHeight,r=window.innerHeight;"top"===this.options.stickTo?(o-=n,a-=t+n):"bottom"===this.options.stickTo&&(o-=r-(t+s),a-=r-s),this.topPoint=o,this.bottomPoint=a,i&&i()}},{key:"destroy",value:function(){this._removeSticky(!0),this.$element.removeClass(this.options.stickyClass+" is-anchored is-at-top").css({height:"",top:"",bottom:"","max-width":""}).off("resizeme.zf.trigger"),this.$anchor&&this.$anchor.length&&this.$anchor.off("change.zf.sticky"),t(window).off(this.scrollListener),this.wasWrapped?this.$element.unwrap():this.$container.removeClass(this.options.containerClass).css({height:""}),Foundation.unregisterPlugin(this)}}]),i}();i.defaults={container:"<div data-sticky-container></div>",stickTo:"top",anchor:"",topAnchor:"",btmAnchor:"",marginTop:1,marginBottom:1,stickyOn:"medium",stickyClass:"sticky",containerClass:"sticky-container",checkEvery:-1},Foundation.plugin(i,"Sticky")}(jQuery);var _createClass=function(){function t(t,e){for(var i=0;i<e.length;i++){var n=e[i];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,n.key,n)}}return function(e,i,n){return i&&t(e.prototype,i),n&&t(e,n),e}}();!function(t){var e=function(){function e(i,n){_classCallCheck(this,e),this.$element=i,this.options=t.extend({},e.defaults,n),this.rules=[],this.currentPath="",this._init(),this._events(),Foundation.registerPlugin(this,"Interchange")}return _createClass(e,[{key:"_init",value:function(){this._addBreakpoints(),this._generateRules(),this._reflow()}},{key:"_events",value:function(){t(window).on("resize.zf.interchange",Foundation.util.throttle(this._reflow.bind(this),50))}},{key:"_reflow",value:function(){var t;for(var e in this.rules)if(this.rules.hasOwnProperty(e)){var i=this.rules[e];window.matchMedia(i.query).matches&&(t=i)}t&&this.replace(t.path)}},{key:"_addBreakpoints",value:function(){for(var t in Foundation.MediaQuery.queries)if(Foundation.MediaQuery.queries.hasOwnProperty(t)){var i=Foundation.MediaQuery.queries[t];e.SPECIAL_QUERIES[i.name]=i.value}}},{key:"_generateRules",value:function(t){var i,n=[];i=this.options.rules?this.options.rules:this.$element.data("interchange").match(/\[.*?\]/g);for(var s in i)if(i.hasOwnProperty(s)){var o=i[s].slice(1,-1).split(", "),a=o.slice(0,-1).join(""),r=o[o.length-1];e.SPECIAL_QUERIES[r]&&(r=e.SPECIAL_QUERIES[r]),n.push({path:a,query:r})}this.rules=n}},{key:"replace",value:function(e){if(this.currentPath!==e){var i=this,n="replaced.zf.interchange";"IMG"===this.$element[0].nodeName?this.$element.attr("src",e).load(function(){i.currentPath=e}).trigger(n):e.match(/\.(gif|jpg|jpeg|png|svg|tiff)([?#].*)?/i)?this.$element.css({"background-image":"url("+e+")"}).trigger(n):t.get(e,function(s){i.$element.html(s).trigger(n),t(s).foundation(),i.currentPath=e})}}},{key:"destroy",value:function(){}}]),e}();e.defaults={rules:null},e.SPECIAL_QUERIES={landscape:"screen and (orientation: landscape)",portrait:"screen and (orientation: portrait)",retina:"only screen and (-webkit-min-device-pixel-ratio: 2), only screen and (min--moz-device-pixel-ratio: 2), only screen and (-o-min-device-pixel-ratio: 2/1), only screen and (min-device-pixel-ratio: 2), only screen and (min-resolution: 192dpi), only screen and (min-resolution: 2dppx)"},Foundation.plugin(e,"Interchange")}(jQuery);var _createClass=function(){function t(t,e){for(var i=0;i<e.length;i++){var n=e[i];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,n.key,n)}}return function(e,i,n){return i&&t(e.prototype,i),n&&t(e,n),e}}();!function(t){var e=function(){function e(i,n){_classCallCheck(this,e),this.$element=t(i),this.options=t.extend({},e.defaults,this.$element.data(),n),this._init(),this._events(),Foundation.registerPlugin(this,"ResponsiveToggle")}return _createClass(e,[{key:"_init",value:function(){var e=this.$element.data("responsive-toggle");e||console.error("Your tab bar needs an ID of a Menu as the value of data-tab-bar."),this.$targetMenu=t("#"+e),this.$toggler=this.$element.find("[data-toggle]"),this._update()}},{key:"_events",value:function(){this._updateMqHandler=this._update.bind(this),t(window).on("changed.zf.mediaquery",this._updateMqHandler),this.$toggler.on("click.zf.responsiveToggle",this.toggleMenu.bind(this))}},{key:"_update",value:function(){Foundation.MediaQuery.atLeast(this.options.hideFor)?(this.$element.hide(),this.$targetMenu.show()):(this.$element.show(),this.$targetMenu.hide())}},{key:"toggleMenu",value:function(){Foundation.MediaQuery.atLeast(this.options.hideFor)||(this.$targetMenu.toggle(0),this.$element.trigger("toggled.zf.responsiveToggle"))}},{key:"destroy",value:function(){this.$element.off(".zf.responsiveToggle"),this.$toggler.off(".zf.responsiveToggle"),t(window).off("changed.zf.mediaquery",this._updateMqHandler),Foundation.unregisterPlugin(this)}}]),e}();e.defaults={hideFor:"medium"},Foundation.plugin(e,"ResponsiveToggle")}(jQuery);var _createClass=function(){function t(t,e){for(var i=0;i<e.length;i++){var n=e[i];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,n.key,n)}}return function(e,i,n){return i&&t(e.prototype,i),n&&t(e,n),e}}();!function(t){var e=function(){function e(i,n){_classCallCheck(this,e),this.$element=i,this.options=t.extend({},e.defaults,i.data(),n),this.className="",this._init(),this._events(),Foundation.registerPlugin(this,"Toggler")}return _createClass(e,[{key:"_init",value:function(){var e;this.options.animate?(e=this.options.animate.split(" "),this.animationIn=e[0],this.animationOut=e[1]||null):(e=this.$element.data("toggler"),this.className="."===e[0]?e.slice(1):e);var i=this.$element[0].id;t('[data-open="'+i+'"], [data-close="'+i+'"], [data-toggle="'+i+'"]').attr("aria-controls",i),this.$element.attr("aria-expanded",!this.$element.is(":hidden"))}},{key:"_events",value:function(){this.$element.off("toggle.zf.trigger").on("toggle.zf.trigger",this.toggle.bind(this))}},{key:"toggle",value:function(){this[this.options.animate?"_toggleAnimate":"_toggleClass"]()}},{key:"_toggleClass",value:function(){this.$element.toggleClass(this.className);var t=this.$element.hasClass(this.className);t?this.$element.trigger("on.zf.toggler"):this.$element.trigger("off.zf.toggler"),this._updateARIA(t)}},{key:"_toggleAnimate",value:function(){var t=this;this.$element.is(":hidden")?Foundation.Motion.animateIn(this.$element,this.animationIn,function(){t._updateARIA(!0),this.trigger("on.zf.toggler")}):Foundation.Motion.animateOut(this.$element,this.animationOut,function(){t._updateARIA(!1),this.trigger("off.zf.toggler")})}},{key:"_updateARIA",value:function(t){this.$element.attr("aria-expanded",!!t)}},{key:"destroy",value:function(){this.$element.off(".zf.toggler"),Foundation.unregisterPlugin(this)}}]),e}();e.defaults={animate:!1},Foundation.plugin(e,"Toggler")}(jQuery);var _createClass=function(){function t(t,e){for(var i=0;i<e.length;i++){var n=e[i];n.enumerable=n.enumerable||!1,
n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,n.key,n)}}return function(e,i,n){return i&&t(e.prototype,i),n&&t(e,n),e}}();!function(t){var e=function(){function e(i){var n=arguments.length<=1||void 0===arguments[1]?{}:arguments[1];_classCallCheck(this,e),this.$element=i,this.options=t.extend({},e.defaults,this.$element.data(),n),this._init(),Foundation.registerPlugin(this,"Abide")}return _createClass(e,[{key:"_init",value:function(){this.$inputs=this.$element.find("input, textarea, select"),this._events()}},{key:"_events",value:function(){var e=this;this.$element.off(".abide").on("reset.zf.abide",function(){e.resetForm()}).on("submit.zf.abide",function(){return e.validateForm()}),"fieldChange"===this.options.validateOn&&this.$inputs.off("change.zf.abide").on("change.zf.abide",function(i){e.validateInput(t(i.target))}),this.options.liveValidate&&this.$inputs.off("input.zf.abide").on("input.zf.abide",function(i){e.validateInput(t(i.target))})}},{key:"_reflow",value:function(){this._init()}},{key:"requiredCheck",value:function(t){if(!t.attr("required"))return!0;var e=!0;switch(t[0].type){case"checkbox":e=t[0].checked;break;case"select":case"select-one":case"select-multiple":var i=t.find("option:selected");i.length&&i.val()||(e=!1);break;default:t.val()&&t.val().length||(e=!1)}return e}},{key:"findFormError",value:function(t){var e=t.siblings(this.options.formErrorSelector);return e.length||(e=t.parent().find(this.options.formErrorSelector)),e}},{key:"findLabel",value:function(t){var e=t[0].id,i=this.$element.find('label[for="'+e+'"]');return i.length?i:t.closest("label")}},{key:"findRadioLabels",value:function(e){var i=this,n=e.map(function(e,n){var s=n.id,o=i.$element.find('label[for="'+s+'"]');return o.length||(o=t(n).closest("label")),o[0]});return t(n)}},{key:"addErrorClasses",value:function(t){var e=this.findLabel(t),i=this.findFormError(t);e.length&&e.addClass(this.options.labelErrorClass),i.length&&i.addClass(this.options.formErrorClass),t.addClass(this.options.inputErrorClass).attr("data-invalid","")}},{key:"removeRadioErrorClasses",value:function(t){var e=this.$element.find(':radio[name="'+t+'"]'),i=this.findRadioLabels(e),n=this.findFormError(e);i.length&&i.removeClass(this.options.labelErrorClass),n.length&&n.removeClass(this.options.formErrorClass),e.removeClass(this.options.inputErrorClass).removeAttr("data-invalid")}},{key:"removeErrorClasses",value:function(t){if("radio"==t[0].type)return this.removeRadioErrorClasses(t.attr("name"));var e=this.findLabel(t),i=this.findFormError(t);e.length&&e.removeClass(this.options.labelErrorClass),i.length&&i.removeClass(this.options.formErrorClass),t.removeClass(this.options.inputErrorClass).removeAttr("data-invalid")}},{key:"validateInput",value:function(t){var e=this.requiredCheck(t),i=!1,n=!0,s=t.attr("data-validator"),o=!0;if(t.is("[data-abide-ignore]")||t.is('[type="hidden"]'))return!0;switch(t[0].type){case"radio":i=this.validateRadio(t.attr("name"));break;case"checkbox":i=e;break;case"select":case"select-one":case"select-multiple":i=e;break;default:i=this.validateText(t)}s&&(n=this.matchValidation(t,s,t.attr("required"))),t.attr("data-equalto")&&(o=this.options.validators.equalTo(t));var a=-1===[e,i,n,o].indexOf(!1),r=(a?"valid":"invalid")+".zf.abide";return this[a?"removeErrorClasses":"addErrorClasses"](t),t.trigger(r,[t]),a}},{key:"validateForm",value:function(){var e=[],i=this;this.$inputs.each(function(){e.push(i.validateInput(t(this)))});var n=-1===e.indexOf(!1);return this.$element.find("[data-abide-error]").css("display",n?"none":"block"),this.$element.trigger((n?"formvalid":"forminvalid")+".zf.abide",[this.$element]),n}},{key:"validateText",value:function(t,e){e=e||t.attr("pattern")||t.attr("type");var i=t.val(),n=!1;return i.length?n=this.options.patterns.hasOwnProperty(e)?this.options.patterns[e].test(i):e!==t.attr("type")?new RegExp(e).test(i):!0:t.prop("required")||(n=!0),n}},{key:"validateRadio",value:function(e){var i=this.$element.find(':radio[name="'+e+'"]'),n=!1,s=!1;return i.each(function(e,i){t(i).attr("required")&&(s=!0)}),s||(n=!0),n||i.each(function(e,i){t(i).prop("checked")&&(n=!0)}),n}},{key:"matchValidation",value:function(t,e,i){var n=this;i=!!i;var s=e.split(" ").map(function(e){return n.options.validators[e](t,i,t.parent())});return-1===s.indexOf(!1)}},{key:"resetForm",value:function(){var e=this.$element,i=this.options;t("."+i.labelErrorClass,e).not("small").removeClass(i.labelErrorClass),t("."+i.inputErrorClass,e).not("small").removeClass(i.inputErrorClass),t(i.formErrorSelector+"."+i.formErrorClass).removeClass(i.formErrorClass),e.find("[data-abide-error]").css("display","none"),t(":input",e).not(":button, :submit, :reset, :hidden, :radio, :checkbox, [data-abide-ignore]").val("").removeAttr("data-invalid"),t(":input:radio",e).not("[data-abide-ignore]").prop("checked",!1).removeAttr("data-invalid"),t(":input:checkbox",e).not("[data-abide-ignore]").prop("checked",!1).removeAttr("data-invalid"),e.trigger("formreset.zf.abide",[e])}},{key:"destroy",value:function(){var e=this;this.$element.off(".abide").find("[data-abide-error]").css("display","none"),this.$inputs.off(".abide").each(function(){e.removeErrorClasses(t(this))}),Foundation.unregisterPlugin(this)}}]),e}();e.defaults={validateOn:"fieldChange",labelErrorClass:"is-invalid-label",inputErrorClass:"is-invalid-input",formErrorSelector:".form-error",formErrorClass:"is-visible",liveValidate:!1,patterns:{alpha:/^[a-zA-Z]+$/,alpha_numeric:/^[a-zA-Z0-9]+$/,integer:/^[-+]?\d+$/,number:/^[-+]?\d*(?:[\.\,]\d+)?$/,card:/^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|6(?:011|5[0-9][0-9])[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\d{3})\d{11})$/,cvv:/^([0-9]){3,4}$/,email:/^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/,url:/^(https?|ftp|file|ssh):\/\/(((([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-zA-Z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-zA-Z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-zA-Z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-zA-Z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-zA-Z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-zA-Z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/,domain:/^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,8}$/,datetime:/^([0-2][0-9]{3})\-([0-1][0-9])\-([0-3][0-9])T([0-5][0-9])\:([0-5][0-9])\:([0-5][0-9])(Z|([\-\+]([0-1][0-9])\:00))$/,date:/(?:19|20)[0-9]{2}-(?:(?:0[1-9]|1[0-2])-(?:0[1-9]|1[0-9]|2[0-9])|(?:(?!02)(?:0[1-9]|1[0-2])-(?:30))|(?:(?:0[13578]|1[02])-31))$/,time:/^(0[0-9]|1[0-9]|2[0-3])(:[0-5][0-9]){2}$/,dateISO:/^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/,month_day_year:/^(0[1-9]|1[012])[- \/.](0[1-9]|[12][0-9]|3[01])[- \/.]\d{4}$/,day_month_year:/^(0[1-9]|[12][0-9]|3[01])[- \/.](0[1-9]|1[012])[- \/.]\d{4}$/,color:/^#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/},validators:{equalTo:function(e,i,n){return t("#"+e.attr("data-equalto")).val()===e.val()}}},Foundation.plugin(e,"Abide")}(jQuery);var _createClass=function(){function t(t,e){for(var i=0;i<e.length;i++){var n=e[i];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,n.key,n)}}return function(e,i,n){return i&&t(e.prototype,i),n&&t(e,n),e}}();!function(t){var e=function(){function e(i,n){_classCallCheck(this,e),this.$element=i,this.options=t.extend({},e.defaults,this.$element.data(),n),this._init(),Foundation.registerPlugin(this,"Equalizer")}return _createClass(e,[{key:"_init",value:function(){var e=this.$element.attr("data-equalizer")||"",i=this.$element.find('[data-equalizer-watch="'+e+'"]');this.$watched=i.length?i:this.$element.find("[data-equalizer-watch]"),this.$element.attr("data-resize",e||Foundation.GetYoDigits(6,"eq")),this.hasNested=this.$element.find("[data-equalizer]").length>0,this.isNested=this.$element.parentsUntil(document.body,"[data-equalizer]").length>0,this.isOn=!1,this._bindHandler={onResizeMeBound:this._onResizeMe.bind(this),onPostEqualizedBound:this._onPostEqualized.bind(this)};var n,s=this.$element.find("img");this.options.equalizeOn?(n=this._checkMQ(),t(window).on("changed.zf.mediaquery",this._checkMQ.bind(this))):this._events(),(void 0!==n&&n===!1||void 0===n)&&(s.length?Foundation.onImagesLoaded(s,this._reflow.bind(this)):this._reflow())}},{key:"_pauseEvents",value:function(){this.isOn=!1,this.$element.off({".zf.equalizer":this._bindHandler.onPostEqualizedBound,"resizeme.zf.trigger":this._bindHandler.onResizeMeBound})}},{key:"_onResizeMe",value:function(t){this._reflow()}},{key:"_onPostEqualized",value:function(t){t.target!==this.$element[0]&&this._reflow()}},{key:"_events",value:function(){this._pauseEvents(),this.hasNested?this.$element.on("postequalized.zf.equalizer",this._bindHandler.onPostEqualizedBound):this.$element.on("resizeme.zf.trigger",this._bindHandler.onResizeMeBound),this.isOn=!0}},{key:"_checkMQ",value:function(){var t=!Foundation.MediaQuery.atLeast(this.options.equalizeOn);return t?this.isOn&&(this._pauseEvents(),this.$watched.css("height","auto")):this.isOn||this._events(),t}},{key:"_killswitch",value:function(){}},{key:"_reflow",value:function(){return!this.options.equalizeOnStack&&this._isStacked()?(this.$watched.css("height","auto"),!1):void(this.options.equalizeByRow?this.getHeightsByRow(this.applyHeightByRow.bind(this)):this.getHeights(this.applyHeight.bind(this)))}},{key:"_isStacked",value:function(){return this.$watched[0].getBoundingClientRect().top!==this.$watched[1].getBoundingClientRect().top}},{key:"getHeights",value:function(t){for(var e=[],i=0,n=this.$watched.length;n>i;i++)this.$watched[i].style.height="auto",e.push(this.$watched[i].offsetHeight);t(e)}},{key:"getHeightsByRow",value:function(e){var i=this.$watched.length?this.$watched.first().offset().top:0,n=[],s=0;n[s]=[];for(var o=0,a=this.$watched.length;a>o;o++){this.$watched[o].style.height="auto";var r=t(this.$watched[o]).offset().top;r!=i&&(s++,n[s]=[],i=r),n[s].push([this.$watched[o],this.$watched[o].offsetHeight])}for(var l=0,u=n.length;u>l;l++){var d=t(n[l]).map(function(){return this[1]}).get(),h=Math.max.apply(null,d);n[l].push(h)}e(n)}},{key:"applyHeight",value:function(t){var e=Math.max.apply(null,t);this.$element.trigger("preequalized.zf.equalizer"),this.$watched.css("height",e),this.$element.trigger("postequalized.zf.equalizer")}},{key:"applyHeightByRow",value:function(e){this.$element.trigger("preequalized.zf.equalizer");for(var i=0,n=e.length;n>i;i++){var s=e[i].length,o=e[i][s-1];if(2>=s)t(e[i][0][0]).css({height:"auto"});else{this.$element.trigger("preequalizedrow.zf.equalizer");for(var a=0,r=s-1;r>a;a++)t(e[i][a][0]).css({height:o});this.$element.trigger("postequalizedrow.zf.equalizer")}}this.$element.trigger("postequalized.zf.equalizer")}},{key:"destroy",value:function(){this._pauseEvents(),this.$watched.css("height","auto"),Foundation.unregisterPlugin(this)}}]),e}();e.defaults={equalizeOnStack:!0,equalizeByRow:!1,equalizeOn:""},Foundation.plugin(e,"Equalizer")}(jQuery);




!function(e){e.fn.hoverIntent=function(t,i,o){var s={interval:100,sensitivity:7,timeout:0};s="object"==typeof t?e.extend(s,t):e.isFunction(i)?e.extend(s,{over:t,out:i,selector:o}):e.extend(s,{over:t,out:t,selector:i});var n,a,l,r,d=function(e){n=e.pageX,a=e.pageY},c=function(t,i){return i.hoverIntent_t=clearTimeout(i.hoverIntent_t),Math.abs(l-n)+Math.abs(r-a)<s.sensitivity?(e(i).off("mousemove.hoverIntent",d),i.hoverIntent_s=1,s.over.apply(i,[t])):(l=n,r=a,i.hoverIntent_t=setTimeout(function(){c(t,i)},s.interval),void 0)},u=function(e,t){return t.hoverIntent_t=clearTimeout(t.hoverIntent_t),t.hoverIntent_s=0,s.out.apply(t,[e])},h=function(t){var i=jQuery.extend({},t),o=this;o.hoverIntent_t&&(o.hoverIntent_t=clearTimeout(o.hoverIntent_t)),"mouseenter"==t.type?(l=i.pageX,r=i.pageY,e(o).on("mousemove.hoverIntent",d),1!=o.hoverIntent_s&&(o.hoverIntent_t=setTimeout(function(){c(i,o)},s.interval))):(e(o).off("mousemove.hoverIntent",d),1==o.hoverIntent_s&&(o.hoverIntent_t=setTimeout(function(){u(i,o)},s.timeout)))};return this.on({"mouseenter.hoverIntent":h,"mouseleave.hoverIntent":h},s.selector)}}(jQuery),function(e){"function"==typeof define&&define.amd?define(["jquery"],e):e(jQuery)}(function(e){function t(t,o){var s,n,a,l=t.nodeName.toLowerCase();return"area"===l?(s=t.parentNode,n=s.name,!(!t.href||!n||"map"!==s.nodeName.toLowerCase())&&(a=e("img[usemap='#"+n+"']")[0],!!a&&i(a))):(/^(input|select|textarea|button|object)$/.test(l)?!t.disabled:"a"===l?t.href||o:o)&&i(t)}function i(t){return e.expr.filters.visible(t)&&!e(t).parents().addBack().filter(function(){return"hidden"===e.css(this,"visibility")}).length}e.ui=e.ui||{},e.extend(e.ui,{version:"1.11.4",keyCode:{BACKSPACE:8,COMMA:188,DELETE:46,DOWN:40,END:35,ENTER:13,ESCAPE:27,HOME:36,LEFT:37,PAGE_DOWN:34,PAGE_UP:33,PERIOD:190,RIGHT:39,SPACE:32,TAB:9,UP:38}}),e.fn.extend({scrollParent:function(t){var i=this.css("position"),o="absolute"===i,s=t?/(auto|scroll|hidden)/:/(auto|scroll)/,n=this.parents().filter(function(){var t=e(this);return(!o||"static"!==t.css("position"))&&s.test(t.css("overflow")+t.css("overflow-y")+t.css("overflow-x"))}).eq(0);return"fixed"!==i&&n.length?n:e(this[0].ownerDocument||document)},uniqueId:function(){var e=0;return function(){return this.each(function(){this.id||(this.id="ui-id-"+ ++e)})}}(),removeUniqueId:function(){return this.each(function(){/^ui-id-\d+$/.test(this.id)&&e(this).removeAttr("id")})}}),e.extend(e.expr[":"],{data:e.expr.createPseudo?e.expr.createPseudo(function(t){return function(i){return!!e.data(i,t)}}):function(t,i,o){return!!e.data(t,o[3])},focusable:function(i){return t(i,!isNaN(e.attr(i,"tabindex")))},tabbable:function(i){var o=e.attr(i,"tabindex"),s=isNaN(o);return(s||o>=0)&&t(i,!s)}}),e("<a>").outerWidth(1).jquery||e.each(["Width","Height"],function(t,i){function o(t,i,o,n){return e.each(s,function(){i-=parseFloat(e.css(t,"padding"+this))||0,o&&(i-=parseFloat(e.css(t,"border"+this+"Width"))||0),n&&(i-=parseFloat(e.css(t,"margin"+this))||0)}),i}var s="Width"===i?["Left","Right"]:["Top","Bottom"],n=i.toLowerCase(),a={innerWidth:e.fn.innerWidth,innerHeight:e.fn.innerHeight,outerWidth:e.fn.outerWidth,outerHeight:e.fn.outerHeight};e.fn["inner"+i]=function(t){return void 0===t?a["inner"+i].call(this):this.each(function(){e(this).css(n,o(this,t)+"px")})},e.fn["outer"+i]=function(t,s){return"number"!=typeof t?a["outer"+i].call(this,t):this.each(function(){e(this).css(n,o(this,t,!0,s)+"px")})}}),e.fn.addBack||(e.fn.addBack=function(e){return this.add(null==e?this.prevObject:this.prevObject.filter(e))}),e("<a>").data("a-b","a").removeData("a-b").data("a-b")&&(e.fn.removeData=function(t){return function(i){return arguments.length?t.call(this,e.camelCase(i)):t.call(this)}}(e.fn.removeData)),e.ui.ie=!!/msie [\w.]+/.exec(navigator.userAgent.toLowerCase()),e.fn.extend({focus:function(t){return function(i,o){return"number"==typeof i?this.each(function(){var t=this;setTimeout(function(){e(t).focus(),o&&o.call(t)},i)}):t.apply(this,arguments)}}(e.fn.focus),disableSelection:function(){var e="onselectstart"in document.createElement("div")?"selectstart":"mousedown";return function(){return this.bind(e+".ui-disableSelection",function(e){e.preventDefault()})}}(),enableSelection:function(){return this.unbind(".ui-disableSelection")},zIndex:function(t){if(void 0!==t)return this.css("zIndex",t);if(this.length)for(var i,o,s=e(this[0]);s.length&&s[0]!==document;){if(i=s.css("position"),("absolute"===i||"relative"===i||"fixed"===i)&&(o=parseInt(s.css("zIndex"),10),!isNaN(o)&&0!==o))return o;s=s.parent()}return 0}}),e.ui.plugin={add:function(t,i,o){var s,n=e.ui[t].prototype;for(s in o)n.plugins[s]=n.plugins[s]||[],n.plugins[s].push([i,o[s]])},call:function(e,t,i,o){var s,n=e.plugins[t];if(n&&(o||e.element[0].parentNode&&11!==e.element[0].parentNode.nodeType))for(s=0;s<n.length;s++)e.options[n[s][0]]&&n[s][1].apply(e.element,i)}};var o=0,s=Array.prototype.slice;e.cleanData=function(t){return function(i){var o,s,n;for(n=0;null!=(s=i[n]);n++)try{o=e._data(s,"events"),o&&o.remove&&e(s).triggerHandler("remove")}catch(e){}t(i)}}(e.cleanData),e.widget=function(t,i,o){var s,n,a,l,r={},d=t.split(".")[0];return t=t.split(".")[1],s=d+"-"+t,o||(o=i,i=e.Widget),e.expr[":"][s.toLowerCase()]=function(t){return!!e.data(t,s)},e[d]=e[d]||{},n=e[d][t],a=e[d][t]=function(e,t){return this._createWidget?void(arguments.length&&this._createWidget(e,t)):new a(e,t)},e.extend(a,n,{version:o.version,_proto:e.extend({},o),_childConstructors:[]}),l=new i,l.options=e.widget.extend({},l.options),e.each(o,function(t,o){return e.isFunction(o)?void(r[t]=function(){var e=function(){return i.prototype[t].apply(this,arguments)},s=function(e){return i.prototype[t].apply(this,e)};return function(){var t,i=this._super,n=this._superApply;return this._super=e,this._superApply=s,t=o.apply(this,arguments),this._super=i,this._superApply=n,t}}()):void(r[t]=o)}),a.prototype=e.widget.extend(l,{widgetEventPrefix:n?l.widgetEventPrefix||t:t},r,{constructor:a,namespace:d,widgetName:t,widgetFullName:s}),n?(e.each(n._childConstructors,function(t,i){var o=i.prototype;e.widget(o.namespace+"."+o.widgetName,a,i._proto)}),delete n._childConstructors):i._childConstructors.push(a),e.widget.bridge(t,a),a},e.widget.extend=function(t){for(var i,o,n=s.call(arguments,1),a=0,l=n.length;a<l;a++)for(i in n[a])o=n[a][i],n[a].hasOwnProperty(i)&&void 0!==o&&(e.isPlainObject(o)?t[i]=e.isPlainObject(t[i])?e.widget.extend({},t[i],o):e.widget.extend({},o):t[i]=o);return t},e.widget.bridge=function(t,i){var o=i.prototype.widgetFullName||t;e.fn[t]=function(n){var a="string"==typeof n,l=s.call(arguments,1),r=this;return a?this.each(function(){var i,s=e.data(this,o);return"instance"===n?(r=s,!1):s?e.isFunction(s[n])&&"_"!==n.charAt(0)?(i=s[n].apply(s,l),i!==s&&void 0!==i?(r=i&&i.jquery?r.pushStack(i.get()):i,!1):void 0):e.error("no such method '"+n+"' for "+t+" widget instance"):e.error("cannot call methods on "+t+" prior to initialization; attempted to call method '"+n+"'")}):(l.length&&(n=e.widget.extend.apply(null,[n].concat(l))),this.each(function(){var t=e.data(this,o);t?(t.option(n||{}),t._init&&t._init()):e.data(this,o,new i(n,this))})),r}},e.Widget=function(){},e.Widget._childConstructors=[],e.Widget.prototype={widgetName:"widget",widgetEventPrefix:"",defaultElement:"<div>",options:{disabled:!1,create:null},_createWidget:function(t,i){i=e(i||this.defaultElement||this)[0],this.element=e(i),this.uuid=o++,this.eventNamespace="."+this.widgetName+this.uuid,this.bindings=e(),this.hoverable=e(),this.focusable=e(),i!==this&&(e.data(i,this.widgetFullName,this),this._on(!0,this.element,{remove:function(e){e.target===i&&this.destroy()}}),this.document=e(i.style?i.ownerDocument:i.document||i),this.window=e(this.document[0].defaultView||this.document[0].parentWindow)),this.options=e.widget.extend({},this.options,this._getCreateOptions(),t),this._create(),this._trigger("create",null,this._getCreateEventData()),this._init()},_getCreateOptions:e.noop,_getCreateEventData:e.noop,_create:e.noop,_init:e.noop,destroy:function(){this._destroy(),this.element.unbind(this.eventNamespace).removeData(this.widgetFullName).removeData(e.camelCase(this.widgetFullName)),this.widget().unbind(this.eventNamespace).removeAttr("aria-disabled").removeClass(this.widgetFullName+"-disabled ui-state-disabled"),this.bindings.unbind(this.eventNamespace),this.hoverable.removeClass("ui-state-hover"),this.focusable.removeClass("ui-state-focus")},_destroy:e.noop,widget:function(){return this.element},option:function(t,i){var o,s,n,a=t;if(0===arguments.length)return e.widget.extend({},this.options);if("string"==typeof t)if(a={},o=t.split("."),t=o.shift(),o.length){for(s=a[t]=e.widget.extend({},this.options[t]),n=0;n<o.length-1;n++)s[o[n]]=s[o[n]]||{},s=s[o[n]];if(t=o.pop(),1===arguments.length)return void 0===s[t]?null:s[t];s[t]=i}else{if(1===arguments.length)return void 0===this.options[t]?null:this.options[t];a[t]=i}return this._setOptions(a),this},_setOptions:function(e){var t;for(t in e)this._setOption(t,e[t]);return this},_setOption:function(e,t){return this.options[e]=t,"disabled"===e&&(this.widget().toggleClass(this.widgetFullName+"-disabled",!!t),t&&(this.hoverable.removeClass("ui-state-hover"),this.focusable.removeClass("ui-state-focus"))),this},enable:function(){return this._setOptions({disabled:!1})},disable:function(){return this._setOptions({disabled:!0})},_on:function(t,i,o){var s,n=this;"boolean"!=typeof t&&(o=i,i=t,t=!1),o?(i=s=e(i),this.bindings=this.bindings.add(i)):(o=i,i=this.element,s=this.widget()),e.each(o,function(o,a){function l(){if(t||n.options.disabled!==!0&&!e(this).hasClass("ui-state-disabled"))return("string"==typeof a?n[a]:a).apply(n,arguments)}"string"!=typeof a&&(l.guid=a.guid=a.guid||l.guid||e.guid++);var r=o.match(/^([\w:-]*)\s*(.*)$/),d=r[1]+n.eventNamespace,c=r[2];c?s.delegate(c,d,l):i.bind(d,l)})},_off:function(t,i){i=(i||"").split(" ").join(this.eventNamespace+" ")+this.eventNamespace,t.unbind(i).undelegate(i),this.bindings=e(this.bindings.not(t).get()),this.focusable=e(this.focusable.not(t).get()),this.hoverable=e(this.hoverable.not(t).get())},_delay:function(e,t){function i(){return("string"==typeof e?o[e]:e).apply(o,arguments)}var o=this;return setTimeout(i,t||0)},_hoverable:function(t){this.hoverable=this.hoverable.add(t),this._on(t,{mouseenter:function(t){e(t.currentTarget).addClass("ui-state-hover")},mouseleave:function(t){e(t.currentTarget).removeClass("ui-state-hover")}})},_focusable:function(t){this.focusable=this.focusable.add(t),this._on(t,{focusin:function(t){e(t.currentTarget).addClass("ui-state-focus")},focusout:function(t){e(t.currentTarget).removeClass("ui-state-focus")}})},_trigger:function(t,i,o){var s,n,a=this.options[t];if(o=o||{},i=e.Event(i),i.type=(t===this.widgetEventPrefix?t:this.widgetEventPrefix+t).toLowerCase(),i.target=this.element[0],n=i.originalEvent)for(s in n)s in i||(i[s]=n[s]);return this.element.trigger(i,o),!(e.isFunction(a)&&a.apply(this.element[0],[i].concat(o))===!1||i.isDefaultPrevented())}},e.each({show:"fadeIn",hide:"fadeOut"},function(t,i){e.Widget.prototype["_"+t]=function(o,s,n){"string"==typeof s&&(s={effect:s});var a,l=s?s===!0||"number"==typeof s?i:s.effect||i:t;s=s||{},"number"==typeof s&&(s={duration:s}),a=!e.isEmptyObject(s),s.complete=n,s.delay&&o.delay(s.delay),a&&e.effects&&e.effects.effect[l]?o[t](s):l!==t&&o[l]?o[l](s.duration,s.easing,n):o.queue(function(i){e(this)[t](),n&&n.call(o[0]),i()})}});var n=(e.widget,!1);e(document).mouseup(function(){n=!1});e.widget("ui.mouse",{version:"1.11.4",options:{cancel:"input,textarea,button,select,option",distance:1,delay:0},_mouseInit:function(){var t=this;this.element.bind("mousedown."+this.widgetName,function(e){return t._mouseDown(e)}).bind("click."+this.widgetName,function(i){if(!0===e.data(i.target,t.widgetName+".preventClickEvent"))return e.removeData(i.target,t.widgetName+".preventClickEvent"),i.stopImmediatePropagation(),!1}),this.started=!1},_mouseDestroy:function(){this.element.unbind("."+this.widgetName),this._mouseMoveDelegate&&this.document.unbind("mousemove."+this.widgetName,this._mouseMoveDelegate).unbind("mouseup."+this.widgetName,this._mouseUpDelegate)},_mouseDown:function(t){if(!n){this._mouseMoved=!1,this._mouseStarted&&this._mouseUp(t),this._mouseDownEvent=t;var i=this,o=1===t.which,s=!("string"!=typeof this.options.cancel||!t.target.nodeName)&&e(t.target).closest(this.options.cancel).length;return!(o&&!s&&this._mouseCapture(t))||(this.mouseDelayMet=!this.options.delay,this.mouseDelayMet||(this._mouseDelayTimer=setTimeout(function(){i.mouseDelayMet=!0},this.options.delay)),this._mouseDistanceMet(t)&&this._mouseDelayMet(t)&&(this._mouseStarted=this._mouseStart(t)!==!1,!this._mouseStarted)?(t.preventDefault(),!0):(!0===e.data(t.target,this.widgetName+".preventClickEvent")&&e.removeData(t.target,this.widgetName+".preventClickEvent"),this._mouseMoveDelegate=function(e){return i._mouseMove(e)},this._mouseUpDelegate=function(e){return i._mouseUp(e)},this.document.bind("mousemove."+this.widgetName,this._mouseMoveDelegate).bind("mouseup."+this.widgetName,this._mouseUpDelegate),t.preventDefault(),n=!0,!0))}},_mouseMove:function(t){if(this._mouseMoved){if(e.ui.ie&&(!document.documentMode||document.documentMode<9)&&!t.button)return this._mouseUp(t);if(!t.which)return this._mouseUp(t)}return(t.which||t.button)&&(this._mouseMoved=!0),this._mouseStarted?(this._mouseDrag(t),t.preventDefault()):(this._mouseDistanceMet(t)&&this._mouseDelayMet(t)&&(this._mouseStarted=this._mouseStart(this._mouseDownEvent,t)!==!1,this._mouseStarted?this._mouseDrag(t):this._mouseUp(t)),!this._mouseStarted)},_mouseUp:function(t){return this.document.unbind("mousemove."+this.widgetName,this._mouseMoveDelegate).unbind("mouseup."+this.widgetName,this._mouseUpDelegate),this._mouseStarted&&(this._mouseStarted=!1,t.target===this._mouseDownEvent.target&&e.data(t.target,this.widgetName+".preventClickEvent",!0),this._mouseStop(t)),n=!1,!1},_mouseDistanceMet:function(e){return Math.max(Math.abs(this._mouseDownEvent.pageX-e.pageX),Math.abs(this._mouseDownEvent.pageY-e.pageY))>=this.options.distance},_mouseDelayMet:function(){return this.mouseDelayMet},_mouseStart:function(){},_mouseDrag:function(){},_mouseStop:function(){},_mouseCapture:function(){return!0}});!function(){function t(e,t,i){return[parseFloat(e[0])*(p.test(e[0])?t/100:1),parseFloat(e[1])*(p.test(e[1])?i/100:1)]}function i(t,i){return parseInt(e.css(t,i),10)||0}function o(t){var i=t[0];return 9===i.nodeType?{width:t.width(),height:t.height(),offset:{top:0,left:0}}:e.isWindow(i)?{width:t.width(),height:t.height(),offset:{top:t.scrollTop(),left:t.scrollLeft()}}:i.preventDefault?{width:0,height:0,offset:{top:i.pageY,left:i.pageX}}:{width:t.outerWidth(),height:t.outerHeight(),offset:t.offset()}}e.ui=e.ui||{};var s,n,a=Math.max,l=Math.abs,r=Math.round,d=/left|center|right/,c=/top|center|bottom/,u=/[\+\-]\d+(\.[\d]+)?%?/,h=/^\w+/,p=/%$/,f=e.fn.position;e.position={scrollbarWidth:function(){if(void 0!==s)return s;var t,i,o=e("<div style='display:block;position:absolute;width:50px;height:50px;overflow:hidden;'><div style='height:100px;width:auto;'></div></div>"),n=o.children()[0];return e("body").append(o),t=n.offsetWidth,o.css("overflow","scroll"),i=n.offsetWidth,t===i&&(i=o[0].clientWidth),o.remove(),s=t-i},getScrollInfo:function(t){var i=t.isWindow||t.isDocument?"":t.element.css("overflow-x"),o=t.isWindow||t.isDocument?"":t.element.css("overflow-y"),s="scroll"===i||"auto"===i&&t.width<t.element[0].scrollWidth,n="scroll"===o||"auto"===o&&t.height<t.element[0].scrollHeight;return{width:n?e.position.scrollbarWidth():0,height:s?e.position.scrollbarWidth():0}},getWithinInfo:function(t){var i=e(t||window),o=e.isWindow(i[0]),s=!!i[0]&&9===i[0].nodeType;return{element:i,isWindow:o,isDocument:s,offset:i.offset()||{left:0,top:0},scrollLeft:i.scrollLeft(),scrollTop:i.scrollTop(),width:o||s?i.width():i.outerWidth(),height:o||s?i.height():i.outerHeight()}}},e.fn.position=function(s){if(!s||!s.of)return f.apply(this,arguments);s=e.extend({},s);var p,v,m,g,w,b,S=e(s.of),y=e.position.getWithinInfo(s.within),C=e.position.getScrollInfo(y),k=(s.collision||"flip").split(" "),_={};return b=o(S),S[0].preventDefault&&(s.at="left top"),v=b.width,m=b.height,g=b.offset,w=e.extend({},g),e.each(["my","at"],function(){var e,t,i=(s[this]||"").split(" ");1===i.length&&(i=d.test(i[0])?i.concat(["center"]):c.test(i[0])?["center"].concat(i):["center","center"]),i[0]=d.test(i[0])?i[0]:"center",i[1]=c.test(i[1])?i[1]:"center",e=u.exec(i[0]),t=u.exec(i[1]),_[this]=[e?e[0]:0,t?t[0]:0],s[this]=[h.exec(i[0])[0],h.exec(i[1])[0]]}),1===k.length&&(k[1]=k[0]),"right"===s.at[0]?w.left+=v:"center"===s.at[0]&&(w.left+=v/2),"bottom"===s.at[1]?w.top+=m:"center"===s.at[1]&&(w.top+=m/2),p=t(_.at,v,m),w.left+=p[0],w.top+=p[1],this.each(function(){var o,d,c=e(this),u=c.outerWidth(),h=c.outerHeight(),f=i(this,"marginLeft"),b=i(this,"marginTop"),T=u+f+i(this,"marginRight")+C.width,x=h+b+i(this,"marginBottom")+C.height,$=e.extend({},w),M=t(_.my,c.outerWidth(),c.outerHeight());"right"===s.my[0]?$.left-=u:"center"===s.my[0]&&($.left-=u/2),"bottom"===s.my[1]?$.top-=h:"center"===s.my[1]&&($.top-=h/2),$.left+=M[0],$.top+=M[1],n||($.left=r($.left),$.top=r($.top)),o={marginLeft:f,marginTop:b},e.each(["left","top"],function(t,i){e.ui.position[k[t]]&&e.ui.position[k[t]][i]($,{targetWidth:v,targetHeight:m,elemWidth:u,elemHeight:h,collisionPosition:o,collisionWidth:T,collisionHeight:x,offset:[p[0]+M[0],p[1]+M[1]],my:s.my,at:s.at,within:y,elem:c})}),s.using&&(d=function(e){var t=g.left-$.left,i=t+v-u,o=g.top-$.top,n=o+m-h,r={target:{element:S,left:g.left,top:g.top,width:v,height:m},element:{element:c,left:$.left,top:$.top,width:u,height:h},horizontal:i<0?"left":t>0?"right":"center",vertical:n<0?"top":o>0?"bottom":"middle"};v<u&&l(t+i)<v&&(r.horizontal="center"),m<h&&l(o+n)<m&&(r.vertical="middle"),a(l(t),l(i))>a(l(o),l(n))?r.important="horizontal":r.important="vertical",s.using.call(this,e,r)}),c.offset(e.extend($,{using:d}))})},e.ui.position={fit:{left:function(e,t){var i,o=t.within,s=o.isWindow?o.scrollLeft:o.offset.left,n=o.width,l=e.left-t.collisionPosition.marginLeft,r=s-l,d=l+t.collisionWidth-n-s;t.collisionWidth>n?r>0&&d<=0?(i=e.left+r+t.collisionWidth-n-s,e.left+=r-i):d>0&&r<=0?e.left=s:r>d?e.left=s+n-t.collisionWidth:e.left=s:r>0?e.left+=r:d>0?e.left-=d:e.left=a(e.left-l,e.left)},top:function(e,t){var i,o=t.within,s=o.isWindow?o.scrollTop:o.offset.top,n=t.within.height,l=e.top-t.collisionPosition.marginTop,r=s-l,d=l+t.collisionHeight-n-s;t.collisionHeight>n?r>0&&d<=0?(i=e.top+r+t.collisionHeight-n-s,e.top+=r-i):d>0&&r<=0?e.top=s:r>d?e.top=s+n-t.collisionHeight:e.top=s:r>0?e.top+=r:d>0?e.top-=d:e.top=a(e.top-l,e.top)}},flip:{left:function(e,t){var i,o,s=t.within,n=s.offset.left+s.scrollLeft,a=s.width,r=s.isWindow?s.scrollLeft:s.offset.left,d=e.left-t.collisionPosition.marginLeft,c=d-r,u=d+t.collisionWidth-a-r,h="left"===t.my[0]?-t.elemWidth:"right"===t.my[0]?t.elemWidth:0,p="left"===t.at[0]?t.targetWidth:"right"===t.at[0]?-t.targetWidth:0,f=-2*t.offset[0];c<0?(i=e.left+h+p+f+t.collisionWidth-a-n,(i<0||i<l(c))&&(e.left+=h+p+f)):u>0&&(o=e.left-t.collisionPosition.marginLeft+h+p+f-r,(o>0||l(o)<u)&&(e.left+=h+p+f))},top:function(e,t){var i,o,s=t.within,n=s.offset.top+s.scrollTop,a=s.height,r=s.isWindow?s.scrollTop:s.offset.top,d=e.top-t.collisionPosition.marginTop,c=d-r,u=d+t.collisionHeight-a-r,h="top"===t.my[1],p=h?-t.elemHeight:"bottom"===t.my[1]?t.elemHeight:0,f="top"===t.at[1]?t.targetHeight:"bottom"===t.at[1]?-t.targetHeight:0,v=-2*t.offset[1];c<0?(o=e.top+p+f+v+t.collisionHeight-a-n,(o<0||o<l(c))&&(e.top+=p+f+v)):u>0&&(i=e.top-t.collisionPosition.marginTop+p+f+v-r,(i>0||l(i)<u)&&(e.top+=p+f+v))}},flipfit:{left:function(){e.ui.position.flip.left.apply(this,arguments),e.ui.position.fit.left.apply(this,arguments)},top:function(){e.ui.position.flip.top.apply(this,arguments),e.ui.position.fit.top.apply(this,arguments)}}},function(){var t,i,o,s,a,l=document.getElementsByTagName("body")[0],r=document.createElement("div");t=document.createElement(l?"div":"body"),o={visibility:"hidden",width:0,height:0,border:0,margin:0,background:"none"},l&&e.extend(o,{position:"absolute",left:"-1000px",top:"-1000px"});for(a in o)t.style[a]=o[a];t.appendChild(r),i=l||document.documentElement,i.insertBefore(t,i.firstChild),r.style.cssText="position: absolute; left: 10.7432222px;",s=e(r).offset().left,n=s>10&&s<11,t.innerHTML="",i.removeChild(t)}()}();e.ui.position,e.widget("ui.slider",e.ui.mouse,{version:"1.11.4",widgetEventPrefix:"slide",options:{animate:!1,distance:0,max:100,min:0,orientation:"horizontal",range:!1,step:1,value:0,values:null,change:null,slide:null,start:null,stop:null},numPages:5,_create:function(){this._keySliding=!1,this._mouseSliding=!1,this._animateOff=!0,this._handleIndex=null,this._detectOrientation(),this._mouseInit(),this._calculateNewMax(),this.element.addClass("ui-slider ui-slider-"+this.orientation+" ui-widget ui-widget-content ui-corner-all"),this._refresh(),this._setOption("disabled",this.options.disabled),this._animateOff=!1},_refresh:function(){this._createRange(),this._createHandles(),this._setupEvents(),this._refreshValue()},_createHandles:function(){var t,i,o=this.options,s=this.element.find(".ui-slider-handle").addClass("ui-state-default ui-corner-all"),n="<span class='ui-slider-handle ui-state-default ui-corner-all' tabindex='0'></span>",a=[];for(i=o.values&&o.values.length||1,s.length>i&&(s.slice(i).remove(),s=s.slice(0,i)),t=s.length;t<i;t++)a.push(n);this.handles=s.add(e(a.join("")).appendTo(this.element)),this.handle=this.handles.eq(0),this.handles.each(function(t){e(this).data("ui-slider-handle-index",t)})},_createRange:function(){var t=this.options,i="";t.range?(t.range===!0&&(t.values?t.values.length&&2!==t.values.length?t.values=[t.values[0],t.values[0]]:e.isArray(t.values)&&(t.values=t.values.slice(0)):t.values=[this._valueMin(),this._valueMin()]),this.range&&this.range.length?this.range.removeClass("ui-slider-range-min ui-slider-range-max").css({left:"",bottom:""}):(this.range=e("<div></div>").appendTo(this.element),i="ui-slider-range ui-widget-header ui-corner-all"),this.range.addClass(i+("min"===t.range||"max"===t.range?" ui-slider-range-"+t.range:""))):(this.range&&this.range.remove(),this.range=null)},_setupEvents:function(){this._off(this.handles),this._on(this.handles,this._handleEvents),this._hoverable(this.handles),this._focusable(this.handles)},_destroy:function(){this.handles.remove(),this.range&&this.range.remove(),this.element.removeClass("ui-slider ui-slider-horizontal ui-slider-vertical ui-widget ui-widget-content ui-corner-all"),this._mouseDestroy()},_mouseCapture:function(t){var i,o,s,n,a,l,r,d,c=this,u=this.options;return!u.disabled&&(this.elementSize={width:this.element.outerWidth(),height:this.element.outerHeight()},this.elementOffset=this.element.offset(),i={x:t.pageX,y:t.pageY},o=this._normValueFromMouse(i),s=this._valueMax()-this._valueMin()+1,this.handles.each(function(t){var i=Math.abs(o-c.values(t));(s>i||s===i&&(t===c._lastChangedValue||c.values(t)===u.min))&&(s=i,n=e(this),a=t)}),l=this._start(t,a),l!==!1&&(this._mouseSliding=!0,this._handleIndex=a,n.addClass("ui-state-active").focus(),r=n.offset(),d=!e(t.target).parents().addBack().is(".ui-slider-handle"),this._clickOffset=d?{left:0,top:0}:{left:t.pageX-r.left-n.width()/2,top:t.pageY-r.top-n.height()/2-(parseInt(n.css("borderTopWidth"),10)||0)-(parseInt(n.css("borderBottomWidth"),10)||0)+(parseInt(n.css("marginTop"),10)||0)},this.handles.hasClass("ui-state-hover")||this._slide(t,a,o),this._animateOff=!0,!0))},_mouseStart:function(){return!0},_mouseDrag:function(e){var t={x:e.pageX,y:e.pageY},i=this._normValueFromMouse(t);return this._slide(e,this._handleIndex,i),!1},_mouseStop:function(e){return this.handles.removeClass("ui-state-active"),this._mouseSliding=!1,this._stop(e,this._handleIndex),this._change(e,this._handleIndex),this._handleIndex=null,this._clickOffset=null,this._animateOff=!1,!1},_detectOrientation:function(){this.orientation="vertical"===this.options.orientation?"vertical":"horizontal"},_normValueFromMouse:function(e){var t,i,o,s,n;return"horizontal"===this.orientation?(t=this.elementSize.width,i=e.x-this.elementOffset.left-(this._clickOffset?this._clickOffset.left:0)):(t=this.elementSize.height,i=e.y-this.elementOffset.top-(this._clickOffset?this._clickOffset.top:0)),o=i/t,o>1&&(o=1),o<0&&(o=0),"vertical"===this.orientation&&(o=1-o),s=this._valueMax()-this._valueMin(),n=this._valueMin()+o*s,this._trimAlignValue(n)},_start:function(e,t){var i={handle:this.handles[t],value:this.value()};return this.options.values&&this.options.values.length&&(i.value=this.values(t),i.values=this.values()),this._trigger("start",e,i)},_slide:function(e,t,i){var o,s,n;this.options.values&&this.options.values.length?(o=this.values(t?0:1),2===this.options.values.length&&this.options.range===!0&&(0===t&&i>o||1===t&&i<o)&&(i=o),i!==this.values(t)&&(s=this.values(),s[t]=i,n=this._trigger("slide",e,{handle:this.handles[t],value:i,values:s}),o=this.values(t?0:1),n!==!1&&this.values(t,i))):i!==this.value()&&(n=this._trigger("slide",e,{handle:this.handles[t],value:i}),n!==!1&&this.value(i))},_stop:function(e,t){var i={handle:this.handles[t],value:this.value()};this.options.values&&this.options.values.length&&(i.value=this.values(t),i.values=this.values()),this._trigger("stop",e,i)},_change:function(e,t){if(!this._keySliding&&!this._mouseSliding){var i={handle:this.handles[t],value:this.value()};this.options.values&&this.options.values.length&&(i.value=this.values(t),i.values=this.values()),this._lastChangedValue=t,this._trigger("change",e,i)}},value:function(e){return arguments.length?(this.options.value=this._trimAlignValue(e),this._refreshValue(),void this._change(null,0)):this._value()},values:function(t,i){var o,s,n;if(arguments.length>1)return this.options.values[t]=this._trimAlignValue(i),this._refreshValue(),void this._change(null,t);if(!arguments.length)return this._values();if(!e.isArray(arguments[0]))return this.options.values&&this.options.values.length?this._values(t):this.value();for(o=this.options.values,s=arguments[0],n=0;n<o.length;n+=1)o[n]=this._trimAlignValue(s[n]),this._change(null,n);this._refreshValue()},_setOption:function(t,i){var o,s=0;switch("range"===t&&this.options.range===!0&&("min"===i?(this.options.value=this._values(0),this.options.values=null):"max"===i&&(this.options.value=this._values(this.options.values.length-1),this.options.values=null)),e.isArray(this.options.values)&&(s=this.options.values.length),"disabled"===t&&this.element.toggleClass("ui-state-disabled",!!i),this._super(t,i),t){case"orientation":this._detectOrientation(),this.element.removeClass("ui-slider-horizontal ui-slider-vertical").addClass("ui-slider-"+this.orientation),this._refreshValue(),this.handles.css("horizontal"===i?"bottom":"left","");break;case"value":this._animateOff=!0,this._refreshValue(),this._change(null,0),this._animateOff=!1;break;case"values":for(this._animateOff=!0,this._refreshValue(),o=0;o<s;o+=1)this._change(null,o);this._animateOff=!1;break;case"step":case"min":case"max":this._animateOff=!0,this._calculateNewMax(),this._refreshValue(),this._animateOff=!1;break;case"range":this._animateOff=!0,this._refresh(),this._animateOff=!1}},_value:function(){var e=this.options.value;return e=this._trimAlignValue(e)},_values:function(e){var t,i,o;if(arguments.length)return t=this.options.values[e],t=this._trimAlignValue(t);if(this.options.values&&this.options.values.length){for(i=this.options.values.slice(),o=0;o<i.length;o+=1)i[o]=this._trimAlignValue(i[o]);return i}return[]},_trimAlignValue:function(e){if(e<=this._valueMin())return this._valueMin();if(e>=this._valueMax())return this._valueMax();var t=this.options.step>0?this.options.step:1,i=(e-this._valueMin())%t,o=e-i;return 2*Math.abs(i)>=t&&(o+=i>0?t:-t),parseFloat(o.toFixed(5))},_calculateNewMax:function(){var e=this.options.max,t=this._valueMin(),i=this.options.step,o=Math.floor(+(e-t).toFixed(this._precision())/i)*i;e=o+t,this.max=parseFloat(e.toFixed(this._precision()))},_precision:function(){var e=this._precisionOf(this.options.step);return null!==this.options.min&&(e=Math.max(e,this._precisionOf(this.options.min))),e},_precisionOf:function(e){var t=e.toString(),i=t.indexOf(".");return i===-1?0:t.length-i-1},_valueMin:function(){return this.options.min},_valueMax:function(){return this.max},_refreshValue:function(){var t,i,o,s,n,a=this.options.range,l=this.options,r=this,d=!this._animateOff&&l.animate,c={};this.options.values&&this.options.values.length?this.handles.each(function(o){i=(r.values(o)-r._valueMin())/(r._valueMax()-r._valueMin())*100,c["horizontal"===r.orientation?"left":"bottom"]=i+"%",e(this).stop(1,1)[d?"animate":"css"](c,l.animate),r.options.range===!0&&("horizontal"===r.orientation?(0===o&&r.range.stop(1,1)[d?"animate":"css"]({left:i+"%"},l.animate),1===o&&r.range[d?"animate":"css"]({width:i-t+"%"},{queue:!1,duration:l.animate})):(0===o&&r.range.stop(1,1)[d?"animate":"css"]({bottom:i+"%"},l.animate),1===o&&r.range[d?"animate":"css"]({height:i-t+"%"},{queue:!1,duration:l.animate}))),t=i}):(o=this.value(),s=this._valueMin(),n=this._valueMax(),i=n!==s?(o-s)/(n-s)*100:0,c["horizontal"===this.orientation?"left":"bottom"]=i+"%",this.handle.stop(1,1)[d?"animate":"css"](c,l.animate),"min"===a&&"horizontal"===this.orientation&&this.range.stop(1,1)[d?"animate":"css"]({width:i+"%"},l.animate),"max"===a&&"horizontal"===this.orientation&&this.range[d?"animate":"css"]({width:100-i+"%"},{queue:!1,duration:l.animate}),"min"===a&&"vertical"===this.orientation&&this.range.stop(1,1)[d?"animate":"css"]({height:i+"%"},l.animate),"max"===a&&"vertical"===this.orientation&&this.range[d?"animate":"css"]({height:100-i+"%"},{queue:!1,duration:l.animate}))},_handleEvents:{keydown:function(t){var i,o,s,n,a=e(t.target).data("ui-slider-handle-index");switch(t.keyCode){case e.ui.keyCode.HOME:case e.ui.keyCode.END:case e.ui.keyCode.PAGE_UP:case e.ui.keyCode.PAGE_DOWN:case e.ui.keyCode.UP:case e.ui.keyCode.RIGHT:case e.ui.keyCode.DOWN:case e.ui.keyCode.LEFT:if(t.preventDefault(),!this._keySliding&&(this._keySliding=!0,e(t.target).addClass("ui-state-active"),i=this._start(t,a),i===!1))return}switch(n=this.options.step,o=s=this.options.values&&this.options.values.length?this.values(a):this.value(),t.keyCode){case e.ui.keyCode.HOME:s=this._valueMin();break;case e.ui.keyCode.END:s=this._valueMax();break;case e.ui.keyCode.PAGE_UP:s=this._trimAlignValue(o+(this._valueMax()-this._valueMin())/this.numPages);break;case e.ui.keyCode.PAGE_DOWN:s=this._trimAlignValue(o-(this._valueMax()-this._valueMin())/this.numPages);break;case e.ui.keyCode.UP:case e.ui.keyCode.RIGHT:if(o===this._valueMax())return;s=this._trimAlignValue(o+n);break;case e.ui.keyCode.DOWN:case e.ui.keyCode.LEFT:if(o===this._valueMin())return;s=this._trimAlignValue(o-n)}this._slide(t,a,s)},keyup:function(t){var i=e(t.target).data("ui-slider-handle-index");this._keySliding&&(this._keySliding=!1,this._stop(t,i),this._change(t,i),e(t.target).removeClass("ui-state-active"))}}})}),function(e){e.fn.styler=function(t){return t=e.extend({wrapper:"form",idSuffix:"-styler",filePlaceholder:"Файл не выбран",fileBrowse:"Обзор...",selectSearch:!0,selectSearchLimit:10,selectSearchNotFound:"Совпадений не найдено",selectSearchPlaceholder:"Поиск...",selectVisibleOptions:0,singleSelectzIndex:"100",selectSmartPositioning:!0,onSelectOpened:function(){},onSelectClosed:function(){},onFormStyled:function(){}},t),this.each(function(){function o(){var e="",i="",o="",n="";void 0!==s.attr("id")&&""!=s.attr("id")&&(e=' id="'+s.attr("id")+t.idSuffix+'"'),void 0!==s.attr("title")&&""!=s.attr("title")&&(i=' title="'+s.attr("title")+'"'),void 0!==s.attr("class")&&""!=s.attr("class")&&(o=" "+s.attr("class"));var a,l=s.data();for(a in l)""!=l[a]&&(n+=" data-"+a+'="'+l[a]+'"');this.id=e+n,this.title=i,this.classes=o}var s=e(this);s.is(":checkbox")?s.each(function(){if(1>s.parent("div.jq-checkbox").length){
var t=function(){var t=new o,i=e("<div"+t.id+' class="jq-checkbox'+t.classes+'"'+t.title+'><div class="jq-checkbox__div"></div></div>');s.css({position:"absolute",zIndex:"-1",opacity:0,margin:0,padding:0}).after(i).prependTo(i),i.attr("unselectable","on").css({"-webkit-user-select":"none","-moz-user-select":"none","-ms-user-select":"none","-o-user-select":"none","user-select":"none",display:"inline-block",position:"relative",overflow:"hidden"}),s.is(":checked")&&i.addClass("checked"),s.is(":disabled")&&i.addClass("disabled"),i.click(function(){return i.is(".disabled")||(s.is(":checked")?(s.prop("checked",!1),i.removeClass("checked")):(s.prop("checked",!0),i.addClass("checked")),s.change()),!1}),s.closest("label").add('label[for="'+s.attr("id")+'"]').click(function(e){i.click(),e.preventDefault()}),s.change(function(){s.is(":checked")?i.addClass("checked"):i.removeClass("checked")}).keydown(function(e){32==e.which&&i.click()}).focus(function(){i.is(".disabled")||i.addClass("focused")}).blur(function(){i.removeClass("focused")})};t(),s.on("refresh",function(){s.parent().before(s).remove(),t()})}}):s.is(":radio")?s.each(function(){if(1>s.parent("div.jq-radio").length){var i=function(){var i=new o,n=e("<div"+i.id+' class="jq-radio'+i.classes+'"'+i.title+'><div class="jq-radio__div"></div></div>');s.css({position:"absolute",zIndex:"-1",opacity:0,margin:0,padding:0}).after(n).prependTo(n),n.attr("unselectable","on").css({"-webkit-user-select":"none","-moz-user-select":"none","-ms-user-select":"none","-o-user-select":"none","user-select":"none",display:"inline-block",position:"relative"}),s.is(":checked")&&n.addClass("checked"),s.is(":disabled")&&n.addClass("disabled"),n.click(function(){return n.is(".disabled")||(n.closest(t.wrapper).find('input[name="'+s.attr("name")+'"]').prop("checked",!1).parent().removeClass("checked"),s.prop("checked",!0).parent().addClass("checked"),s.change()),!1}),s.closest("label").add('label[for="'+s.attr("id")+'"]').click(function(e){n.click(),e.preventDefault()}),s.change(function(){s.parent().addClass("checked")}).focus(function(){n.is(".disabled")||n.addClass("focused")}).blur(function(){n.removeClass("focused")})};i(),s.on("refresh",function(){s.parent().before(s).remove(),i()})}}):s.is(":file")?s.css({position:"absolute",top:0,right:0,width:"100%",height:"100%",opacity:0,margin:0,padding:0}).each(function(){if(1>s.parent("div.jq-file").length){var i=function(){var i=new o,n=e("<div"+i.id+' class="jq-file'+i.classes+'"'+i.title+' style="display: inline-block; position: relative; overflow: hidden"></div>'),a=e('<div class="jq-file__name">'+t.filePlaceholder+"</div>").appendTo(n);e('<div class="jq-file__browse">'+t.fileBrowse+"</div>").appendTo(n),s.after(n),n.append(s),s.is(":disabled")&&n.addClass("disabled"),s.change(function(){a.text(s.val().replace(/.+[\\\/]/,"")),""==s.val()?(a.text(t.filePlaceholder),n.removeClass("changed")):n.addClass("changed")}).focus(function(){n.addClass("focused")}).blur(function(){n.removeClass("focused")}).click(function(){n.removeClass("focused")})};i(),s.on("refresh",function(){s.parent().before(s).remove(),i()})}}):s.is("select")?s.each(function(){if(1>s.parent("div.jqselect").length){var n=function(){function n(t){t.off("mousewheel DOMMouseScroll").on("mousewheel DOMMouseScroll",function(t){var i=null;"mousewheel"==t.type?i=-1*t.originalEvent.wheelDelta:"DOMMouseScroll"==t.type&&(i=40*t.originalEvent.detail),i&&(t.stopPropagation(),t.preventDefault(),e(this).scrollTop(i+e(this).scrollTop()))})}function a(){for(i=0,len=d.length;i<len;i++){var e="",t="",o=e="",s="",n="";d.eq(i).prop("selected")&&(t="selected sel"),d.eq(i).is(":disabled")&&(t="disabled"),d.eq(i).is(":selected:disabled")&&(t="selected sel disabled"),void 0!==d.eq(i).attr("class")&&(o=" "+d.eq(i).attr("class"),n=' data-jqfs-class="'+d.eq(i).attr("class")+'"');var a,l=d.eq(i).data();for(a in l)""!=l[a]&&(e+=" data-"+a+'="'+l[a]+'"');e="<li"+n+e+' class="'+t+o+'">'+d.eq(i).text()+"</li>",d.eq(i).parent().is("optgroup")&&(void 0!==d.eq(i).parent().attr("class")&&(s=" "+d.eq(i).parent().attr("class")),e="<li"+n+' class="'+t+o+" option"+s+'">'+d.eq(i).text()+"</li>",d.eq(i).is(":first-child")&&(e='<li class="optgroup'+s+'">'+d.eq(i).parent().attr("label")+"</li>"+e)),c+=e}}function l(){var i=new o,l=e("<div"+i.id+' class="jq-selectbox jqselect'+i.classes+'" style="display: inline-block; position: relative; z-index:'+t.singleSelectzIndex+'"><div class="jq-selectbox__select"'+i.title+' style="position: relative"><div class="jq-selectbox__select-text"></div><div class="jq-selectbox__trigger"><div class="jq-selectbox__trigger-arrow"></div></div></div></div>');s.css({margin:0,padding:0}).after(l).prependTo(l);var i=e("div.jq-selectbox__select",l),r=e("div.jq-selectbox__select-text",l),u=d.filter(":selected");u.length?r.html(u.text()):r.html(d.first().text()),a();var h="";t.selectSearch&&(h='<div class="jq-selectbox__search"><input type="search" autocomplete="off" placeholder="'+t.selectSearchPlaceholder+'"></div><div class="jq-selectbox__not-found">'+t.selectSearchNotFound+"</div>");var p=e('<div class="jq-selectbox__dropdown" style="position: absolute">'+h+'<ul style="position: relative; list-style: none; overflow: auto; overflow-x: hidden">'+c+"</ul></div>");l.append(p);var f=e("ul",p),v=e("li",p),m=e("input",p),g=e("div.jq-selectbox__not-found",p).hide();v.length<t.selectSearchLimit&&m.parent().hide();var w=0,b=0;v.each(function(){var t=e(this);t.css({display:"inline-block","white-space":"nowrap"}),t.innerWidth()>w&&(w=t.innerWidth(),b=t.width()),t.css({display:"block"})});var h=l.clone().appendTo("body").width("auto"),S=h.width();h.remove(),S==l.width()&&(r.width(b),w+=l.find("div.jq-selectbox__trigger").width()),w>l.width()&&p.width(w),s.css({position:"absolute",left:0,top:0,width:"100%",height:"100%",opacity:0});var y=l.outerHeight(),C=m.outerHeight(),k=f.css("max-height"),h=v.filter(".selected");1>h.length&&v.first().addClass("selected sel"),void 0===v.data("li-height")&&v.data("li-height",v.outerHeight());var _=p.css("top");if("auto"==p.css("left")&&p.css({left:0}),"auto"==p.css("top")&&p.css({top:y}),p.hide(),h.length&&(d.first().text()!=u.text()&&l.addClass("changed"),l.data("jqfs-class",h.data("jqfs-class")),l.addClass(h.data("jqfs-class"))),s.is(":disabled"))return l.addClass("disabled"),!1;i.click(function(){if(s.focus(),e("div.jq-selectbox").filter(".opened").length&&t.onSelectClosed.call(e("div.jq-selectbox").filter(".opened")),!navigator.userAgent.match(/(iPad|iPhone|iPod)/g)){if(t.selectSmartPositioning){var i=e(window),o=l.offset().top,a=i.height()-y-(o-i.scrollTop()),r=t.selectVisibleOptions,d=v.data("li-height"),c=5*d,u=d*r;0<r&&6>r&&(c=u),0==r&&(u="auto"),a>c+C+20?(p.height("auto").css({bottom:"auto",top:_}),r=function(){f.css("max-height",Math.floor((a-20-C)/d)*d)},r(),f.css("max-height",u),"none"!=k&&f.css("max-height",k),a<p.outerHeight()+20&&r()):(p.height("auto").css({top:"auto",bottom:_}),r=function(){f.css("max-height",Math.floor((o-i.scrollTop()-20-C)/d)*d)},r(),f.css("max-height",u),"none"!=k&&f.css("max-height",k),o-i.scrollTop()-20<p.outerHeight()+20&&r())}return e("div.jqselect").css({zIndex:t.singleSelectzIndex-1}).removeClass("opened"),l.css({zIndex:t.singleSelectzIndex}),p.is(":hidden")?(e("div.jq-selectbox__dropdown:visible").hide(),p.show(),l.addClass("opened focused"),t.onSelectOpened.call(l)):(p.hide(),l.removeClass("opened"),e("div.jq-selectbox").filter(".opened").length&&t.onSelectClosed.call(l)),v.filter(".selected").length&&(0!=f.innerHeight()/d%2&&(d/=2),f.scrollTop(f.scrollTop()+v.filter(".selected").position().top-f.innerHeight()/2+d)),m.length&&(m.val("").keyup(),g.hide(),m.focus().keyup(function(){var t=e(this).val();v.each(function(){e(this).html().match(RegExp(".*?"+t+".*?","i"))?e(this).show():e(this).hide()}),1>v.filter(":visible").length?g.show():g.hide()})),n(f),!1}}),v.hover(function(){e(this).siblings().removeClass("selected")});var T=v.filter(".selected").text();v.filter(".selected").text(),v.filter(":not(.disabled):not(.optgroup)").click(function(){var i=e(this),o=i.text();if(T!=o){var n=i.index();i.is(".option")&&(n-=i.prevAll(".optgroup").length),i.addClass("selected sel").siblings().removeClass("selected sel"),d.prop("selected",!1).eq(n).prop("selected",!0),T=o,r.html(o),l.data("jqfs-class")&&l.removeClass(l.data("jqfs-class")),l.data("jqfs-class",i.data("jqfs-class")),l.addClass(i.data("jqfs-class")),s.change()}m.length&&(m.val("").keyup(),g.hide()),p.hide(),l.removeClass("opened"),t.onSelectClosed.call(l)}),p.mouseout(function(){e("li.sel",p).addClass("selected")}),s.change(function(){r.html(d.filter(":selected").text()),v.removeClass("selected sel").not(".optgroup").eq(s[0].selectedIndex).addClass("selected sel"),d.first().text()!=v.filter(".selected").text()?l.addClass("changed"):l.removeClass("changed")}).focus(function(){l.addClass("focused"),e("div.jqselect").removeClass("opened")}).blur(function(){l.removeClass("focused")}).on("keydown keyup",function(e){r.html(d.filter(":selected").text()),v.removeClass("selected sel").not(".optgroup").eq(s[0].selectedIndex).addClass("selected sel"),38!=e.which&&37!=e.which&&33!=e.which||p.scrollTop(p.scrollTop()+v.filter(".selected").position().top),40!=e.which&&39!=e.which&&34!=e.which||p.scrollTop(p.scrollTop()+v.filter(".selected").position().top-p.innerHeight()+liHeight),32==e.which&&e.preventDefault(),13==e.which&&(e.preventDefault(),p.hide())}),e(document).on("click",function(i){e(i.target).parents().hasClass("jq-selectbox")||"OPTION"==i.target.nodeName||(e("div.jq-selectbox").filter(".opened").length&&t.onSelectClosed.call(e("div.jq-selectbox").filter(".opened")),m.length&&m.val("").keyup(),p.hide().find("li.sel").addClass("selected"),l.removeClass("focused opened"))})}function r(){var t=new o,i=e("<div"+t.id+' class="jq-select-multiple jqselect'+t.classes+'"'+t.title+' style="display: inline-block; position: relative"></div>');s.css({margin:0,padding:0}).after(i),a(),i.append("<ul>"+c+"</ul>");var l=e("ul",i).css({position:"relative","overflow-x":"hidden","-webkit-overflow-scrolling":"touch"}),r=e("li",i).attr("unselectable","on").css({"-webkit-user-select":"none","-moz-user-select":"none","-ms-user-select":"none","-o-user-select":"none","user-select":"none","white-space":"nowrap"}),t=s.attr("size"),u=l.outerHeight(),h=r.outerHeight();void 0!==t&&0<t?l.css({height:h*t}):l.css({height:4*h}),u>i.height()&&(l.css("overflowY","scroll"),n(l),r.filter(".selected").length&&l.scrollTop(l.scrollTop()+r.filter(".selected").position().top)),s.prependTo(i).css({position:"absolute",left:0,top:0,width:"100%",height:"100%",opacity:0}),s.is(":disabled")?(i.addClass("disabled"),d.each(function(){e(this).is(":selected")&&r.eq(e(this).index()).addClass("selected")})):(r.filter(":not(.disabled):not(.optgroup)").click(function(t){s.focus(),i.removeClass("focused");var o=e(this);if(t.ctrlKey||t.metaKey||o.addClass("selected"),t.shiftKey||o.addClass("first"),t.ctrlKey||t.metaKey||t.shiftKey||o.siblings().removeClass("selected first"),(t.ctrlKey||t.metaKey)&&(o.is(".selected")?o.removeClass("selected first"):o.addClass("selected first"),o.siblings().removeClass("first")),t.shiftKey){var n=!1,a=!1;o.siblings().removeClass("selected").siblings(".first").addClass("selected"),o.prevAll().each(function(){e(this).is(".first")&&(n=!0)}),o.nextAll().each(function(){e(this).is(".first")&&(a=!0)}),n&&o.prevAll().each(function(){return!e(this).is(".selected")&&void e(this).not(".disabled, .optgroup").addClass("selected")}),a&&o.nextAll().each(function(){return!e(this).is(".selected")&&void e(this).not(".disabled, .optgroup").addClass("selected")}),1==r.filter(".selected").length&&o.addClass("first")}d.prop("selected",!1),r.filter(".selected").each(function(){var t=e(this),i=t.index();t.is(".option")&&(i-=t.prevAll(".optgroup").length),d.eq(i).prop("selected",!0)}),s.change()}),d.each(function(t){e(this).data("optionIndex",t)}),s.change(function(){r.removeClass("selected");var t=[];d.filter(":selected").each(function(){t.push(e(this).data("optionIndex"))}),r.not(".optgroup").filter(function(i){return-1<e.inArray(i,t)}).addClass("selected")}).focus(function(){i.addClass("focused")}).blur(function(){i.removeClass("focused")}),u>i.height()&&s.keydown(function(e){38!=e.which&&37!=e.which&&33!=e.which||l.scrollTop(l.scrollTop()+r.filter(".selected").position().top-h),40!=e.which&&39!=e.which&&34!=e.which||l.scrollTop(l.scrollTop()+r.filter(".selected:last").position().top-l.innerHeight()+2*h)}))}var d=e("option",s),c="";s.is("[multiple]")?r():l()};n(),s.on("refresh",function(){s.parent().before(s).remove(),n()})}}):s.is(":reset")&&s.click(function(){setTimeout(function(){s.closest(t.wrapper).find("input, select").trigger("refresh")},1)})}).promise().done(function(){t.onFormStyled.call()})}}(jQuery),!function(e){"function"==typeof define&&define.amd?define(["jquery"],e):e("object"==typeof exports?require("jquery"):jQuery)}(function(e){function t(){var e=document.createElement("input"),t="onpaste";return e.setAttribute(t,""),"function"==typeof e[t]?"paste":"input"}var i,o=t()+".mask",s=navigator.userAgent,n=/iphone/i.test(s),a=/chrome/i.test(s),l=/android/i.test(s);e.mask={definitions:{9:"[0-9]",a:"[A-Za-z]","*":"[A-Za-z0-9]"},autoclear:!0,dataName:"rawMaskFn",placeholder:"_"},e.fn.extend({caret:function(e,t){var i;if(0!==this.length&&!this.is(":hidden"))return"number"==typeof e?(t="number"==typeof t?t:e,this.each(function(){this.setSelectionRange?this.setSelectionRange(e,t):this.createTextRange&&(i=this.createTextRange(),i.collapse(!0),i.moveEnd("character",t),i.moveStart("character",e),i.select())})):(this[0].setSelectionRange?(e=this[0].selectionStart,t=this[0].selectionEnd):document.selection&&document.selection.createRange&&(i=document.selection.createRange(),e=0-i.duplicate().moveStart("character",-1e5),t=e+i.text.length),{begin:e,end:t})},unmask:function(){return this.trigger("unmask")},mask:function(t,s){var r,d,c,u,h,p,f,v;if(!t&&this.length>0){r=e(this[0]);var m=r.data(e.mask.dataName);return m?m():void 0}return s=e.extend({autoclear:e.mask.autoclear,placeholder:e.mask.placeholder,completed:null},s),d=e.mask.definitions,c=[],u=f=t.length,h=null,e.each(t.split(""),function(e,t){"?"==t?(f--,u=e):d[t]?(c.push(new RegExp(d[t])),null===h&&(h=c.length-1),u>e&&(p=c.length-1)):c.push(null)}),this.trigger("unmask").each(function(){function r(){if(s.completed){for(var e=h;p>=e;e++)if(c[e]&&O[e]===m(e))return;s.completed.call(M)}}function m(e){return s.placeholder.charAt(e<s.placeholder.length?e:0)}function g(e){for(;++e<f&&!c[e];);return e}function w(e){for(;--e>=0&&!c[e];);return e}function b(e,t){var i,o;if(!(0>e)){for(i=e,o=g(t);f>i;i++)if(c[i]){if(!(f>o&&c[i].test(O[o])))break;O[i]=O[o],O[o]=m(o),o=g(o)}x(),M.caret(Math.max(h,e))}}function S(e){var t,i,o,s;for(t=e,i=m(e);f>t;t++)if(c[t]){if(o=g(t),s=O[t],O[t]=i,!(f>o&&c[o].test(s)))break;i=s}}function y(){var e=M.val(),t=M.caret();if(e.length<v.length){for($(!0);t.begin>0&&!c[t.begin-1];)t.begin--;if(0===t.begin)for(;t.begin<h&&!c[t.begin];)t.begin++;M.caret(t.begin,t.begin)}else{for($(!0);t.begin<f&&!c[t.begin];)t.begin++;M.caret(t.begin,t.begin)}r()}function C(){$(),M.val()!=E&&M.change()}function k(e){if(!M.prop("readonly")){var t,i,o,s=e.which||e.keyCode;v=M.val(),8===s||46===s||n&&127===s?(t=M.caret(),i=t.begin,o=t.end,o-i===0&&(i=46!==s?w(i):o=g(i-1),o=46===s?g(o):o),T(i,o),b(i,o-1),e.preventDefault()):13===s?C.call(this,e):27===s&&(M.val(E),M.caret(0,$()),e.preventDefault())}}function _(t){if(!M.prop("readonly")){var i,o,s,n=t.which||t.keyCode,a=M.caret();if(!(t.ctrlKey||t.altKey||t.metaKey||32>n)&&n&&13!==n){if(a.end-a.begin!==0&&(T(a.begin,a.end),b(a.begin,a.end-1)),i=g(a.begin-1),f>i&&(o=String.fromCharCode(n),c[i].test(o))){if(S(i),O[i]=o,x(),s=g(i),l){var d=function(){e.proxy(e.fn.caret,M,s)()};setTimeout(d,0)}else M.caret(s);a.begin<=p&&r()}t.preventDefault()}}}function T(e,t){var i;for(i=e;t>i&&f>i;i++)c[i]&&(O[i]=m(i))}function x(){M.val(O.join(""))}function $(e){var t,i,o,n=M.val(),a=-1;for(t=0,o=0;f>t;t++)if(c[t]){for(O[t]=m(t);o++<n.length;)if(i=n.charAt(o-1),c[t].test(i)){O[t]=i,a=t;break}if(o>n.length){T(t+1,f);break}}else O[t]===n.charAt(o)&&o++,u>t&&(a=t);return e?x():u>a+1?s.autoclear||O.join("")===A?(M.val()&&M.val(""),T(0,f)):x():(x(),M.val(M.val().substring(0,a+1))),u?t:h}var M=e(this),O=e.map(t.split(""),function(e,t){return"?"!=e?d[e]?m(t):e:void 0}),A=O.join(""),E=M.val();M.data(e.mask.dataName,function(){return e.map(O,function(e,t){return c[t]&&e!=m(t)?e:null}).join("")}),M.one("unmask",function(){M.off(".mask").removeData(e.mask.dataName)}).on("focus.mask",function(){if(!M.prop("readonly")){clearTimeout(i);var e;E=M.val(),e=$(),i=setTimeout(function(){x(),e==t.replace("?","").length?M.caret(0,e):M.caret(e)},10)}}).on("blur.mask",C).on("keydown.mask",k).on("keypress.mask",_).on(o,function(){M.prop("readonly")||setTimeout(function(){var e=$(!0);M.caret(e),r()},0)}),a&&l&&M.off("input.mask").on("input.mask",y),$()})}})}),function(e){function t(t){var i=t||window.event,o=[].slice.call(arguments,1),s=0,n=0,a=0;return t=e.event.fix(i),t.type="mousewheel",i.wheelDelta&&(s=i.wheelDelta/120),i.detail&&(s=-i.detail/3),a=s,void 0!==i.axis&&i.axis===i.HORIZONTAL_AXIS&&(a=0,n=-1*s),void 0!==i.wheelDeltaY&&(a=i.wheelDeltaY/120),void 0!==i.wheelDeltaX&&(n=-1*i.wheelDeltaX/120),o.unshift(t,s,n,a),(e.event.dispatch||e.event.handle).apply(this,o)}var i=["DOMMouseScroll","mousewheel"];if(e.event.fixHooks)for(var o=i.length;o;)e.event.fixHooks[i[--o]]=e.event.mouseHooks;e.event.special.mousewheel={setup:function(){if(this.addEventListener)for(var e=i.length;e;)this.addEventListener(i[--e],t,!1);else this.onmousewheel=t},teardown:function(){if(this.removeEventListener)for(var e=i.length;e;)this.removeEventListener(i[--e],t,!1);else this.onmousewheel=null}},e.fn.extend({mousewheel:function(e){return e?this.bind("mousewheel",e):this.trigger("mousewheel")},unmousewheel:function(e){return this.unbind("mousewheel",e)}})}(jQuery),function(e){var t={init:function(t){var i={set_width:!1,set_height:!1,horizontalScroll:!1,scrollInertia:50,mouseWheel:!0,mouseWheelPixels:"auto",autoDraggerLength:!0,autoHideScrollbar:!1,alwaysShowScrollbar:!1,snapAmount:null,snapOffset:0,scrollButtons:{enable:!1,scrollType:"continuous",scrollSpeed:"auto",scrollAmount:40},advanced:{updateOnBrowserResize:!0,updateOnContentResize:!1,autoExpandHorizontalScroll:!1,autoScrollOnFocus:!0,normalizeMouseWheelDelta:!1},contentTouchScroll:!0,callbacks:{onScrollStart:function(){},onScroll:function(){},onTotalScroll:function(){},onTotalScrollBack:function(){},onTotalScrollOffset:0,onTotalScrollBackOffset:0,whileScrolling:function(){}},theme:"light"},t=e.extend(!0,i,t);return this.each(function(){var i=e(this);if(t.set_width&&i.css("width",t.set_width),t.set_height&&i.css("height",t.set_height),e(document).data("mCustomScrollbar-index")){var o=parseInt(e(document).data("mCustomScrollbar-index"));e(document).data("mCustomScrollbar-index",o+1)}else e(document).data("mCustomScrollbar-index","1");i.wrapInner("<div class='mCustomScrollBox mCS-"+t.theme+"' id='mCSB_"+e(document).data("mCustomScrollbar-index")+"' style='position:relative; height:100%; overflow:hidden; max-width:100%;' />").addClass("mCustomScrollbar _mCS_"+e(document).data("mCustomScrollbar-index"));var s=i.children(".mCustomScrollBox");if(t.horizontalScroll){s.addClass("mCSB_horizontal").wrapInner("<div class='mCSB_h_wrapper' style='position:relative; left:0; width:999999px;' />");var n=s.children(".mCSB_h_wrapper");n.wrapInner("<div class='mCSB_container' style='position:absolute; left:0;' />").children(".mCSB_container").css({width:n.children().outerWidth(),position:"relative"}).unwrap()}else s.wrapInner("<div class='mCSB_container' style='position:relative; top:0;' />");var a=s.children(".mCSB_container");e.support.touch&&a.addClass("mCS_touch"),a.after("<div class='mCSB_scrollTools' style='position:absolute;'><div class='mCSB_draggerContainer'><div class='mCSB_dragger' style='position:absolute;' oncontextmenu='return false;'><div class='mCSB_dragger_bar' style='position:relative;'></div></div><div class='mCSB_draggerRail'></div></div></div>");var l=s.children(".mCSB_scrollTools"),r=l.children(".mCSB_draggerContainer"),d=r.children(".mCSB_dragger");if(t.horizontalScroll?d.data("minDraggerWidth",d.width()):d.data("minDraggerHeight",d.height()),t.scrollButtons.enable&&(t.horizontalScroll?l.prepend("<a class='mCSB_buttonLeft' oncontextmenu='return false;'></a>").append("<a class='mCSB_buttonRight' oncontextmenu='return false;'></a>"):l.prepend("<a class='mCSB_buttonUp' oncontextmenu='return false;'></a>").append("<a class='mCSB_buttonDown' oncontextmenu='return false;'></a>")),s.bind("scroll",function(){i.is(".mCS_disabled")||s.scrollTop(0).scrollLeft(0)}),i.data({mCS_Init:!0,mCustomScrollbarIndex:e(document).data("mCustomScrollbar-index"),horizontalScroll:t.horizontalScroll,scrollInertia:t.scrollInertia,scrollEasing:"mcsEaseOut",mouseWheel:t.mouseWheel,mouseWheelPixels:t.mouseWheelPixels,autoDraggerLength:t.autoDraggerLength,autoHideScrollbar:t.autoHideScrollbar,alwaysShowScrollbar:t.alwaysShowScrollbar,snapAmount:t.snapAmount,snapOffset:t.snapOffset,scrollButtons_enable:t.scrollButtons.enable,scrollButtons_scrollType:t.scrollButtons.scrollType,scrollButtons_scrollSpeed:t.scrollButtons.scrollSpeed,scrollButtons_scrollAmount:t.scrollButtons.scrollAmount,autoExpandHorizontalScroll:t.advanced.autoExpandHorizontalScroll,autoScrollOnFocus:t.advanced.autoScrollOnFocus,normalizeMouseWheelDelta:t.advanced.normalizeMouseWheelDelta,contentTouchScroll:t.contentTouchScroll,onScrollStart_Callback:t.callbacks.onScrollStart,onScroll_Callback:t.callbacks.onScroll,onTotalScroll_Callback:t.callbacks.onTotalScroll,onTotalScrollBack_Callback:t.callbacks.onTotalScrollBack,onTotalScroll_Offset:t.callbacks.onTotalScrollOffset,onTotalScrollBack_Offset:t.callbacks.onTotalScrollBackOffset,whileScrolling_Callback:t.callbacks.whileScrolling,bindEvent_scrollbar_drag:!1,bindEvent_content_touch:!1,bindEvent_scrollbar_click:!1,bindEvent_mousewheel:!1,bindEvent_buttonsContinuous_y:!1,bindEvent_buttonsContinuous_x:!1,bindEvent_buttonsPixels_y:!1,bindEvent_buttonsPixels_x:!1,bindEvent_focusin:!1,bindEvent_autoHideScrollbar:!1,mCSB_buttonScrollRight:!1,mCSB_buttonScrollLeft:!1,mCSB_buttonScrollDown:!1,mCSB_buttonScrollUp:!1}),t.horizontalScroll)"none"!==i.css("max-width")&&(t.advanced.updateOnContentResize||(t.advanced.updateOnContentResize=!0));else if("none"!==i.css("max-height")){var c=!1,u=parseInt(i.css("max-height"));i.css("max-height").indexOf("%")>=0&&(c=u,u=i.parent().height()*c/100),i.css("overflow","hidden"),s.css("max-height",u)}if(i.mCustomScrollbar("update"),t.advanced.updateOnBrowserResize){var h,p=e(window).width(),f=e(window).height();e(window).bind("resize."+i.data("mCustomScrollbarIndex"),function(){h&&clearTimeout(h),h=setTimeout(function(){if(!i.is(".mCS_disabled")&&!i.is(".mCS_destroyed")){var t=e(window).width(),o=e(window).height();p===t&&f===o||("none"!==i.css("max-height")&&c&&s.css("max-height",i.parent().height()*c/100),i.mCustomScrollbar("update"),p=t,f=o)}},150)})}if(t.advanced.updateOnContentResize){var v;if(t.horizontalScroll)var m=a.outerWidth();else var m=a.outerHeight();v=setInterval(function(){if(t.horizontalScroll){t.advanced.autoExpandHorizontalScroll&&a.css({position:"absolute",width:"auto"}).wrap("<div class='mCSB_h_wrapper' style='position:relative; left:0; width:999999px;' />").css({width:a.outerWidth(),position:"relative"}).unwrap();var e=a.outerWidth()}else var e=a.outerHeight();e!=m&&(i.mCustomScrollbar("update"),m=e)},300)}})},update:function(){var t=e(this),i=t.children(".mCustomScrollBox"),o=i.children(".mCSB_container");o.removeClass("mCS_no_scrollbar"),t.removeClass("mCS_disabled mCS_destroyed"),i.scrollTop(0).scrollLeft(0);var s=i.children(".mCSB_scrollTools"),n=s.children(".mCSB_draggerContainer"),a=n.children(".mCSB_dragger");if(t.data("horizontalScroll")){var l=s.children(".mCSB_buttonLeft"),r=s.children(".mCSB_buttonRight"),d=i.width();t.data("autoExpandHorizontalScroll")&&o.css({position:"absolute",width:"auto"}).wrap("<div class='mCSB_h_wrapper' style='position:relative; left:0; width:999999px;' />").css({width:o.outerWidth(),position:"relative"}).unwrap();var c=o.outerWidth()}else var u=s.children(".mCSB_buttonUp"),h=s.children(".mCSB_buttonDown"),p=i.height(),f=o.outerHeight();if(f>p&&!t.data("horizontalScroll")){s.css("display","block");var v=n.height();if(t.data("autoDraggerLength")){var m=Math.round(p/f*v),g=a.data("minDraggerHeight");if(m<=g)a.css({height:g});else if(m>=v-10){var w=v-10;a.css({height:w})}else a.css({height:m});a.children(".mCSB_dragger_bar").css({"line-height":a.height()+"px"})}var b=a.height(),S=(f-p)/(v-b);t.data("scrollAmount",S).mCustomScrollbar("scrolling",i,o,n,a,u,h,l,r);var y=Math.abs(o.position().top);t.mCustomScrollbar("scrollTo",y,{scrollInertia:0,trigger:"internal"})}else if(c>d&&t.data("horizontalScroll")){s.css("display","block");var C=n.width();if(t.data("autoDraggerLength")){var k=Math.round(d/c*C),_=a.data("minDraggerWidth");if(k<=_)a.css({width:_});else if(k>=C-10){var T=C-10;a.css({width:T})}else a.css({width:k})}var x=a.width(),S=(c-d)/(C-x);t.data("scrollAmount",S).mCustomScrollbar("scrolling",i,o,n,a,u,h,l,r);var y=Math.abs(o.position().left);t.mCustomScrollbar("scrollTo",y,{scrollInertia:0,trigger:"internal"})}else i.unbind("mousewheel focusin"),t.data("horizontalScroll")?a.add(o).css("left",0):a.add(o).css("top",0),t.data("alwaysShowScrollbar")?t.data("horizontalScroll")?t.data("horizontalScroll")&&a.css({width:n.width()}):a.css({height:n.height()}):(s.css("display","none"),o.addClass("mCS_no_scrollbar")),t.data({bindEvent_mousewheel:!1,bindEvent_focusin:!1})},scrolling:function(t,o,s,n,a,l,r,d){function c(e,t,i,o){p.data("horizontalScroll")?p.mCustomScrollbar("scrollTo",n.position().left-t+o,{moveDragger:!0,trigger:"internal"}):p.mCustomScrollbar("scrollTo",n.position().top-e+i,{moveDragger:!0,trigger:"internal"})}function u(e){n.data("preventAction")||(n.data("preventAction",!0),p.mCustomScrollbar("scrollTo",e,{trigger:"internal"}))}function h(){var e=p.data("scrollButtons_scrollSpeed");return"auto"===p.data("scrollButtons_scrollSpeed")&&(e=Math.round((p.data("scrollInertia")+100)/40)),e}var p=e(this);if(!p.data("bindEvent_scrollbar_drag")){var f,v,m,g,w;e.support.pointer?(m="pointerdown",g="pointermove",w="pointerup"):e.support.msPointer&&(m="MSPointerDown",g="MSPointerMove",w="MSPointerUp"),e.support.pointer||e.support.msPointer?(n.bind(m,function(t){t.preventDefault(),p.data({on_drag:!0}),n.addClass("mCSB_dragger_onDrag");var i=e(this),o=i.offset(),s=t.originalEvent.pageX-o.left,a=t.originalEvent.pageY-o.top;s<i.width()&&s>0&&a<i.height()&&a>0&&(f=a,v=s)}),e(document).bind(g+"."+p.data("mCustomScrollbarIndex"),function(e){if(e.preventDefault(),p.data("on_drag")){var t=n,i=t.offset(),o=e.originalEvent.pageX-i.left,s=e.originalEvent.pageY-i.top;c(f,v,s,o)}}).bind(w+"."+p.data("mCustomScrollbarIndex"),function(e){p.data({on_drag:!1}),n.removeClass("mCSB_dragger_onDrag")})):(n.bind("mousedown touchstart",function(t){t.preventDefault(),t.stopImmediatePropagation();var i,o,s=e(this),a=s.offset();if("touchstart"===t.type){var l=t.originalEvent.touches[0]||t.originalEvent.changedTouches[0];i=l.pageX-a.left,o=l.pageY-a.top}else p.data({on_drag:!0}),n.addClass("mCSB_dragger_onDrag"),i=t.pageX-a.left,o=t.pageY-a.top;i<s.width()&&i>0&&o<s.height()&&o>0&&(f=o,v=i)}).bind("touchmove",function(t){t.preventDefault(),t.stopImmediatePropagation();var i=t.originalEvent.touches[0]||t.originalEvent.changedTouches[0],o=e(this),s=o.offset(),n=i.pageX-s.left,a=i.pageY-s.top;c(f,v,a,n)}),e(document).bind("mousemove."+p.data("mCustomScrollbarIndex"),function(e){if(p.data("on_drag")){var t=n,i=t.offset(),o=e.pageX-i.left,s=e.pageY-i.top;c(f,v,s,o)}}).bind("mouseup."+p.data("mCustomScrollbarIndex"),function(e){p.data({on_drag:!1}),n.removeClass("mCSB_dragger_onDrag")})),p.data({bindEvent_scrollbar_drag:!0})}if(e.support.touch&&p.data("contentTouchScroll")&&!p.data("bindEvent_content_touch")){var b,S,y,C,k,_,T;o.bind("touchstart",function(t){t.stopImmediatePropagation(),b=t.originalEvent.touches[0]||t.originalEvent.changedTouches[0],S=e(this),y=S.offset(),k=b.pageX-y.left,C=b.pageY-y.top,_=C,T=k}),o.bind("touchmove",function(t){t.preventDefault(),t.stopImmediatePropagation(),b=t.originalEvent.touches[0]||t.originalEvent.changedTouches[0],S=e(this).parent(),y=S.offset(),k=b.pageX-y.left,C=b.pageY-y.top,p.data("horizontalScroll")?p.mCustomScrollbar("scrollTo",T-k,{trigger:"internal"}):p.mCustomScrollbar("scrollTo",_-C,{trigger:"internal"})})}if(p.data("bindEvent_scrollbar_click")||(s.bind("click",function(t){var i=(t.pageY-s.offset().top)*p.data("scrollAmount"),o=e(t.target);p.data("horizontalScroll")&&(i=(t.pageX-s.offset().left)*p.data("scrollAmount")),(o.hasClass("mCSB_draggerContainer")||o.hasClass("mCSB_draggerRail"))&&p.mCustomScrollbar("scrollTo",i,{trigger:"internal",scrollEasing:"draggerRailEase"})}),p.data({bindEvent_scrollbar_click:!0})),p.data("mouseWheel")&&(p.data("bindEvent_mousewheel")||(t.bind("mousewheel",function(e,t){var i,a=p.data("mouseWheelPixels"),l=Math.abs(o.position().top),r=n.position().top,d=s.height()-n.height();p.data("normalizeMouseWheelDelta")&&(t=t<0?-1:1),"auto"===a&&(a=100+Math.round(p.data("scrollAmount")/2)),p.data("horizontalScroll")&&(r=n.position().left,d=s.width()-n.width(),l=Math.abs(o.position().left)),(t>0&&0!==r||t<0&&r!==d)&&(e.preventDefault(),e.stopImmediatePropagation()),i=l-t*a,p.mCustomScrollbar("scrollTo",i,{trigger:"internal"})}),p.data({bindEvent_mousewheel:!0}))),p.data("scrollButtons_enable"))if("pixels"===p.data("scrollButtons_scrollType"))p.data("horizontalScroll")?(d.add(r).unbind("mousedown touchstart MSPointerDown pointerdown mouseup MSPointerUp pointerup mouseout MSPointerOut pointerout touchend",x,$),p.data({bindEvent_buttonsContinuous_x:!1}),p.data("bindEvent_buttonsPixels_x")||(d.bind("click",function(e){e.preventDefault(),u(Math.abs(o.position().left)+p.data("scrollButtons_scrollAmount"))}),r.bind("click",function(e){e.preventDefault(),u(Math.abs(o.position().left)-p.data("scrollButtons_scrollAmount"))}),p.data({bindEvent_buttonsPixels_x:!0}))):(l.add(a).unbind("mousedown touchstart MSPointerDown pointerdown mouseup MSPointerUp pointerup mouseout MSPointerOut pointerout touchend",x,$),p.data({bindEvent_buttonsContinuous_y:!1}),p.data("bindEvent_buttonsPixels_y")||(l.bind("click",function(e){e.preventDefault(),u(Math.abs(o.position().top)+p.data("scrollButtons_scrollAmount"))}),a.bind("click",function(e){e.preventDefault(),u(Math.abs(o.position().top)-p.data("scrollButtons_scrollAmount"))}),p.data({bindEvent_buttonsPixels_y:!0})));else if(p.data("horizontalScroll")){if(d.add(r).unbind("click"),p.data({bindEvent_buttonsPixels_x:!1}),!p.data("bindEvent_buttonsContinuous_x")){d.bind("mousedown touchstart MSPointerDown pointerdown",function(e){e.preventDefault();var t=h();p.data({mCSB_buttonScrollRight:setInterval(function(){p.mCustomScrollbar("scrollTo",Math.abs(o.position().left)+t,{trigger:"internal",scrollEasing:"easeOutCirc"})},17)})});var x=function(e){e.preventDefault(),clearInterval(p.data("mCSB_buttonScrollRight"))};d.bind("mouseup touchend MSPointerUp pointerup mouseout MSPointerOut pointerout",x),r.bind("mousedown touchstart MSPointerDown pointerdown",function(e){e.preventDefault();var t=h();p.data({mCSB_buttonScrollLeft:setInterval(function(){p.mCustomScrollbar("scrollTo",Math.abs(o.position().left)-t,{trigger:"internal",scrollEasing:"easeOutCirc"})},17)})});var $=function(e){e.preventDefault(),clearInterval(p.data("mCSB_buttonScrollLeft"))};r.bind("mouseup touchend MSPointerUp pointerup mouseout MSPointerOut pointerout",$),p.data({bindEvent_buttonsContinuous_x:!0})}}else if(l.add(a).unbind("click"),p.data({bindEvent_buttonsPixels_y:!1}),!p.data("bindEvent_buttonsContinuous_y")){l.bind("mousedown touchstart MSPointerDown pointerdown",function(e){
e.preventDefault();var t=h();p.data({mCSB_buttonScrollDown:setInterval(function(){p.mCustomScrollbar("scrollTo",Math.abs(o.position().top)+t,{trigger:"internal",scrollEasing:"easeOutCirc"})},17)})});var M=function(e){e.preventDefault(),clearInterval(p.data("mCSB_buttonScrollDown"))};l.bind("mouseup touchend MSPointerUp pointerup mouseout MSPointerOut pointerout",M),a.bind("mousedown touchstart MSPointerDown pointerdown",function(e){e.preventDefault();var t=h();p.data({mCSB_buttonScrollUp:setInterval(function(){p.mCustomScrollbar("scrollTo",Math.abs(o.position().top)-t,{trigger:"internal",scrollEasing:"easeOutCirc"})},17)})});var O=function(e){e.preventDefault(),clearInterval(p.data("mCSB_buttonScrollUp"))};a.bind("mouseup touchend MSPointerUp pointerup mouseout MSPointerOut pointerout",O),p.data({bindEvent_buttonsContinuous_y:!0})}p.data("autoScrollOnFocus")&&(p.data("bindEvent_focusin")||(t.bind("focusin",function(){t.scrollTop(0).scrollLeft(0);var i=e(document.activeElement);if(i.is("input,textarea,select,button,a[tabindex],area,object")){var s=o.position().top,n=i.position().top,a=t.height()-i.outerHeight();p.data("horizontalScroll")&&(s=o.position().left,n=i.position().left,a=t.width()-i.outerWidth()),(s+n<0||s+n>a)&&p.mCustomScrollbar("scrollTo",n,{trigger:"internal"})}}),p.data({bindEvent_focusin:!0}))),p.data("autoHideScrollbar")&&!p.data("alwaysShowScrollbar")&&(p.data("bindEvent_autoHideScrollbar")||(t.bind("mouseenter",function(e){t.addClass("mCS-mouse-over"),i.showScrollbar.call(t.children(".mCSB_scrollTools"))}).bind("mouseleave touchend",function(e){t.removeClass("mCS-mouse-over"),"mouseleave"===e.type&&i.hideScrollbar.call(t.children(".mCSB_scrollTools"))}),p.data({bindEvent_autoHideScrollbar:!0})))},scrollTo:function(t,o){function s(e){if(c.data("mCustomScrollbarIndex"))switch(this.mcs={top:p.position().top,left:p.position().left,draggerTop:m.position().top,draggerLeft:m.position().left,topPct:Math.round(100*Math.abs(p.position().top)/Math.abs(p.outerHeight()-h.height())),leftPct:Math.round(100*Math.abs(p.position().left)/Math.abs(p.outerWidth()-h.width()))},e){case"onScrollStart":c.data("mCS_tweenRunning",!0).data("onScrollStart_Callback").call(c,this.mcs);break;case"whileScrolling":c.data("whileScrolling_Callback").call(c,this.mcs);break;case"onScroll":c.data("onScroll_Callback").call(c,this.mcs);break;case"onTotalScrollBack":c.data("onTotalScrollBack_Callback").call(c,this.mcs);break;case"onTotalScroll":c.data("onTotalScroll_Callback").call(c,this.mcs)}}var n,a,l,r,d,c=e(this),u={moveDragger:!1,trigger:"external",callbacks:!0,scrollInertia:c.data("scrollInertia"),scrollEasing:c.data("scrollEasing")},o=e.extend(u,o),h=c.children(".mCustomScrollBox"),p=h.children(".mCSB_container"),f=h.children(".mCSB_scrollTools"),v=f.children(".mCSB_draggerContainer"),m=v.children(".mCSB_dragger"),g=draggerSpeed=o.scrollInertia;if(!p.hasClass("mCS_no_scrollbar")&&(c.data({mCS_trigger:o.trigger}),c.data("mCS_Init")&&(o.callbacks=!1),t||0===t)){if("number"==typeof t)o.moveDragger?(n=t,t=c.data("horizontalScroll")?m.position().left*c.data("scrollAmount"):m.position().top*c.data("scrollAmount"),draggerSpeed=0):n=t/c.data("scrollAmount");else if("string"==typeof t){var w;w="top"===t?0:"bottom"!==t||c.data("horizontalScroll")?"left"===t?0:"right"===t&&c.data("horizontalScroll")?p.outerWidth()-h.width():"first"===t?c.find(".mCSB_container").find(":first"):"last"===t?c.find(".mCSB_container").find(":last"):c.find(t):p.outerHeight()-h.height(),1===w.length?(t=c.data("horizontalScroll")?w.position().left:w.position().top,n=t/c.data("scrollAmount")):n=t=w}if(c.data("horizontalScroll")){c.data("onTotalScrollBack_Offset")&&(l=-c.data("onTotalScrollBack_Offset")),c.data("onTotalScroll_Offset")&&(d=h.width()-p.outerWidth()+c.data("onTotalScroll_Offset")),n<0?(n=t=0,clearInterval(c.data("mCSB_buttonScrollLeft")),l||(a=!0)):n>=v.width()-m.width()?(n=v.width()-m.width(),t=h.width()-p.outerWidth(),clearInterval(c.data("mCSB_buttonScrollRight")),d||(r=!0)):t=-t;var b=c.data("snapAmount");b&&(t=Math.round(t/b)*b-c.data("snapOffset")),i.mTweenAxis.call(this,m[0],"left",Math.round(n),draggerSpeed,o.scrollEasing),i.mTweenAxis.call(this,p[0],"left",Math.round(t),g,o.scrollEasing,{onStart:function(){o.callbacks&&!c.data("mCS_tweenRunning")&&s("onScrollStart"),c.data("autoHideScrollbar")&&!c.data("alwaysShowScrollbar")&&i.showScrollbar.call(f)},onUpdate:function(){o.callbacks&&s("whileScrolling")},onComplete:function(){o.callbacks&&(s("onScroll"),(a||l&&p.position().left>=l)&&s("onTotalScrollBack"),(r||d&&p.position().left<=d)&&s("onTotalScroll")),m.data("preventAction",!1),c.data("mCS_tweenRunning",!1),c.data("autoHideScrollbar")&&!c.data("alwaysShowScrollbar")&&(h.hasClass("mCS-mouse-over")||i.hideScrollbar.call(f))}})}else{c.data("onTotalScrollBack_Offset")&&(l=-c.data("onTotalScrollBack_Offset")),c.data("onTotalScroll_Offset")&&(d=h.height()-p.outerHeight()+c.data("onTotalScroll_Offset")),n<0?(n=t=0,clearInterval(c.data("mCSB_buttonScrollUp")),l||(a=!0)):n>=v.height()-m.height()?(n=v.height()-m.height(),t=h.height()-p.outerHeight(),clearInterval(c.data("mCSB_buttonScrollDown")),d||(r=!0)):t=-t;var b=c.data("snapAmount");b&&(t=Math.round(t/b)*b-c.data("snapOffset")),i.mTweenAxis.call(this,m[0],"top",Math.round(n),draggerSpeed,o.scrollEasing),i.mTweenAxis.call(this,p[0],"top",Math.round(t),g,o.scrollEasing,{onStart:function(){o.callbacks&&!c.data("mCS_tweenRunning")&&s("onScrollStart"),c.data("autoHideScrollbar")&&!c.data("alwaysShowScrollbar")&&i.showScrollbar.call(f)},onUpdate:function(){o.callbacks&&s("whileScrolling")},onComplete:function(){o.callbacks&&(s("onScroll"),(a||l&&p.position().top>=l)&&s("onTotalScrollBack"),(r||d&&p.position().top<=d)&&s("onTotalScroll")),m.data("preventAction",!1),c.data("mCS_tweenRunning",!1),c.data("autoHideScrollbar")&&!c.data("alwaysShowScrollbar")&&(h.hasClass("mCS-mouse-over")||i.hideScrollbar.call(f))}})}c.data("mCS_Init")&&c.data({mCS_Init:!1})}},stop:function(){var t=e(this),o=t.children().children(".mCSB_container"),s=t.children().children().children().children(".mCSB_dragger");i.mTweenAxisStop.call(this,o[0]),i.mTweenAxisStop.call(this,s[0])},disable:function(t){var i=e(this),o=i.children(".mCustomScrollBox"),s=o.children(".mCSB_container"),n=o.children(".mCSB_scrollTools"),a=n.children().children(".mCSB_dragger");o.unbind("mousewheel focusin mouseenter mouseleave touchend"),s.unbind("touchstart touchmove"),t&&(i.data("horizontalScroll")?a.add(s).css("left",0):a.add(s).css("top",0)),n.css("display","none"),s.addClass("mCS_no_scrollbar"),i.data({bindEvent_mousewheel:!1,bindEvent_focusin:!1,bindEvent_content_touch:!1,bindEvent_autoHideScrollbar:!1}).addClass("mCS_disabled")},destroy:function(){var t=e(this);t.removeClass("mCustomScrollbar _mCS_"+t.data("mCustomScrollbarIndex")).addClass("mCS_destroyed").children().children(".mCSB_container").unwrap().children().unwrap().siblings(".mCSB_scrollTools").remove(),e(document).unbind("mousemove."+t.data("mCustomScrollbarIndex")+" mouseup."+t.data("mCustomScrollbarIndex")+" MSPointerMove."+t.data("mCustomScrollbarIndex")+" MSPointerUp."+t.data("mCustomScrollbarIndex")),e(window).unbind("resize."+t.data("mCustomScrollbarIndex"))}},i={showScrollbar:function(){this.stop().animate({opacity:1},"fast")},hideScrollbar:function(){this.stop().animate({opacity:0},"fast")},mTweenAxis:function(e,t,i,o,s,n){function a(){return window.performance&&window.performance.now?window.performance.now():window.performance&&window.performance.webkitNow?window.performance.webkitNow():Date.now?Date.now():(new Date).getTime()}function l(){g||p.call(),g=a()-m,r(),g>=e._time&&(e._time=g>e._time?g+h-(g-e._time):g+h-1,e._time<g+1&&(e._time=g+1)),e._time<o?e._id=_request(l):v.call()}function r(){o>0?(e.currVal=u(e._time,w,S,o,s),b[t]=Math.round(e.currVal)+"px"):b[t]=i+"px",f.call()}function d(){h=1e3/60,e._time=g+h,_request=window.requestAnimationFrame?window.requestAnimationFrame:function(e){return r(),setTimeout(e,.01)},e._id=_request(l)}function c(){null!=e._id&&(window.requestAnimationFrame?window.cancelAnimationFrame(e._id):clearTimeout(e._id),e._id=null)}function u(e,t,i,o,s){switch(s){case"linear":return i*e/o+t;case"easeOutQuad":return e/=o,-i*e*(e-2)+t;case"easeInOutQuad":return e/=o/2,e<1?i/2*e*e+t:(e--,-i/2*(e*(e-2)-1)+t);case"easeOutCubic":return e/=o,e--,i*(e*e*e+1)+t;case"easeOutQuart":return e/=o,e--,-i*(e*e*e*e-1)+t;case"easeOutQuint":return e/=o,e--,i*(e*e*e*e*e+1)+t;case"easeOutCirc":return e/=o,e--,i*Math.sqrt(1-e*e)+t;case"easeOutSine":return i*Math.sin(e/o*(Math.PI/2))+t;case"easeOutExpo":return i*(-Math.pow(2,-10*e/o)+1)+t;case"mcsEaseOut":var n=(e/=o)*e,a=n*e;return t+i*(.499999999999997*a*n+-2.5*n*n+5.5*a+-6.5*n+4*e);case"draggerRailEase":return e/=o/2,e<1?i/2*e*e*e+t:(e-=2,i/2*(e*e*e+2)+t)}}var h,n=n||{},p=n.onStart||function(){},f=n.onUpdate||function(){},v=n.onComplete||function(){},m=a(),g=0,w=e.offsetTop,b=e.style;"left"===t&&(w=e.offsetLeft);var S=i-w;c(),d()},mTweenAxisStop:function(e){null!=e._id&&(window.requestAnimationFrame?window.cancelAnimationFrame(e._id):clearTimeout(e._id),e._id=null)},rafPolyfill:function(){for(var e=["ms","moz","webkit","o"],t=e.length;--t>-1&&!window.requestAnimationFrame;)window.requestAnimationFrame=window[e[t]+"RequestAnimationFrame"],window.cancelAnimationFrame=window[e[t]+"CancelAnimationFrame"]||window[e[t]+"CancelRequestAnimationFrame"]}};i.rafPolyfill.call(),e.support.touch=!!("ontouchstart"in window),e.support.pointer=window.navigator.pointerEnabled,e.support.msPointer=window.navigator.msPointerEnabled;var o="https:"==document.location.protocol?"https:":"http:";e.event.special.mousewheel||document.write('<script src="'+o+'//cdnjs.cloudflare.com/ajax/libs/jquery-mousewheel/3.0.6/jquery.mousewheel.min.js"></script>'),e.fn.mCustomScrollbar=function(i){return t[i]?t[i].apply(this,Array.prototype.slice.call(arguments,1)):"object"!=typeof i&&i?void e.error("Method "+i+" does not exist"):t.init.apply(this,arguments)}}(jQuery),!function(e){"use strict";"function"==typeof define&&define.amd?define(["jquery"],e):"undefined"!=typeof exports?module.exports=e(require("jquery")):e(jQuery)}(function(e){"use strict";var t=window.Slick||{};t=function(){function t(t,o){var s,n=this;n.defaults={accessibility:!0,adaptiveHeight:!1,appendArrows:e(t),appendDots:e(t),arrows:!0,asNavFor:null,prevArrow:'<button type="button" data-role="none" class="slick-prev" aria-label="Previous" tabindex="0" role="button">Previous</button>',nextArrow:'<button type="button" data-role="none" class="slick-next" aria-label="Next" tabindex="0" role="button">Next</button>',autoplay:!1,autoplaySpeed:3e3,centerMode:!1,centerPadding:"50px",cssEase:"ease",customPaging:function(t,i){return e('<button type="button" data-role="none" role="button" tabindex="0" />').text(i+1)},dots:!1,dotsClass:"slick-dots",draggable:!0,easing:"linear",edgeFriction:.35,fade:!1,focusOnSelect:!1,infinite:!0,initialSlide:0,lazyLoad:"ondemand",mobileFirst:!1,pauseOnHover:!0,pauseOnFocus:!0,pauseOnDotsHover:!1,respondTo:"window",responsive:null,rows:1,rtl:!1,slide:"",slidesPerRow:1,slidesToShow:1,slidesToScroll:1,speed:500,swipe:!0,swipeToSlide:!1,touchMove:!0,touchThreshold:5,useCSS:!0,useTransform:!0,variableWidth:!1,vertical:!1,verticalSwiping:!1,waitForAnimate:!0,zIndex:1e3},n.initials={animating:!1,dragging:!1,autoPlayTimer:null,currentDirection:0,currentLeft:null,currentSlide:0,direction:1,$dots:null,listWidth:null,listHeight:null,loadIndex:0,$nextArrow:null,$prevArrow:null,slideCount:null,slideWidth:null,$slideTrack:null,$slides:null,sliding:!1,slideOffset:0,swipeLeft:null,$list:null,touchObject:{},transformsEnabled:!1,unslicked:!1},e.extend(n,n.initials),n.activeBreakpoint=null,n.animType=null,n.animProp=null,n.breakpoints=[],n.breakpointSettings=[],n.cssTransitions=!1,n.focussed=!1,n.interrupted=!1,n.hidden="hidden",n.paused=!0,n.positionProp=null,n.respondTo=null,n.rowCount=1,n.shouldClick=!0,n.$slider=e(t),n.$slidesCache=null,n.transformType=null,n.transitionType=null,n.visibilityChange="visibilitychange",n.windowWidth=0,n.windowTimer=null,s=e(t).data("slick")||{},n.options=e.extend({},n.defaults,o,s),n.currentSlide=n.options.initialSlide,n.originalSettings=n.options,"undefined"!=typeof document.mozHidden?(n.hidden="mozHidden",n.visibilityChange="mozvisibilitychange"):"undefined"!=typeof document.webkitHidden&&(n.hidden="webkitHidden",n.visibilityChange="webkitvisibilitychange"),n.autoPlay=e.proxy(n.autoPlay,n),n.autoPlayClear=e.proxy(n.autoPlayClear,n),n.autoPlayIterator=e.proxy(n.autoPlayIterator,n),n.changeSlide=e.proxy(n.changeSlide,n),n.clickHandler=e.proxy(n.clickHandler,n),n.selectHandler=e.proxy(n.selectHandler,n),n.setPosition=e.proxy(n.setPosition,n),n.swipeHandler=e.proxy(n.swipeHandler,n),n.dragHandler=e.proxy(n.dragHandler,n),n.keyHandler=e.proxy(n.keyHandler,n),n.instanceUid=i++,n.htmlExpr=/^(?:\s*(<[\w\W]+>)[^>]*)$/,n.registerBreakpoints(),n.init(!0)}var i=0;return t}(),t.prototype.activateADA=function(){var e=this;e.$slideTrack.find(".slick-active").attr({"aria-hidden":"false"}).find("a, input, button, select").attr({tabindex:"0"})},t.prototype.addSlide=t.prototype.slickAdd=function(t,i,o){var s=this;if("boolean"==typeof i)o=i,i=null;else if(0>i||i>=s.slideCount)return!1;s.unload(),"number"==typeof i?0===i&&0===s.$slides.length?e(t).appendTo(s.$slideTrack):o?e(t).insertBefore(s.$slides.eq(i)):e(t).insertAfter(s.$slides.eq(i)):o===!0?e(t).prependTo(s.$slideTrack):e(t).appendTo(s.$slideTrack),s.$slides=s.$slideTrack.children(this.options.slide),s.$slideTrack.children(this.options.slide).detach(),s.$slideTrack.append(s.$slides),s.$slides.each(function(t,i){e(i).attr("data-slick-index",t)}),s.$slidesCache=s.$slides,s.reinit()},t.prototype.animateHeight=function(){var e=this;if(1===e.options.slidesToShow&&e.options.adaptiveHeight===!0&&e.options.vertical===!1){var t=e.$slides.eq(e.currentSlide).outerHeight(!0);e.$list.animate({height:t},e.options.speed)}},t.prototype.animateSlide=function(t,i){var o={},s=this;s.animateHeight(),s.options.rtl===!0&&s.options.vertical===!1&&(t=-t),s.transformsEnabled===!1?s.options.vertical===!1?s.$slideTrack.animate({left:t},s.options.speed,s.options.easing,i):s.$slideTrack.animate({top:t},s.options.speed,s.options.easing,i):s.cssTransitions===!1?(s.options.rtl===!0&&(s.currentLeft=-s.currentLeft),e({animStart:s.currentLeft}).animate({animStart:t},{duration:s.options.speed,easing:s.options.easing,step:function(e){e=Math.ceil(e),s.options.vertical===!1?(o[s.animType]="translate("+e+"px, 0px)",s.$slideTrack.css(o)):(o[s.animType]="translate(0px,"+e+"px)",s.$slideTrack.css(o))},complete:function(){i&&i.call()}})):(s.applyTransition(),t=Math.ceil(t),s.options.vertical===!1?o[s.animType]="translate3d("+t+"px, 0px, 0px)":o[s.animType]="translate3d(0px,"+t+"px, 0px)",s.$slideTrack.css(o),i&&setTimeout(function(){s.disableTransition(),i.call()},s.options.speed))},t.prototype.getNavTarget=function(){var t=this,i=t.options.asNavFor;return i&&null!==i&&(i=e(i).not(t.$slider)),i},t.prototype.asNavFor=function(t){var i=this,o=i.getNavTarget();null!==o&&"object"==typeof o&&o.each(function(){var i=e(this).slick("getSlick");i.unslicked||i.slideHandler(t,!0)})},t.prototype.applyTransition=function(e){var t=this,i={};t.options.fade===!1?i[t.transitionType]=t.transformType+" "+t.options.speed+"ms "+t.options.cssEase:i[t.transitionType]="opacity "+t.options.speed+"ms "+t.options.cssEase,t.options.fade===!1?t.$slideTrack.css(i):t.$slides.eq(e).css(i)},t.prototype.autoPlay=function(){var e=this;e.autoPlayClear(),e.slideCount>e.options.slidesToShow&&(e.autoPlayTimer=setInterval(e.autoPlayIterator,e.options.autoplaySpeed))},t.prototype.autoPlayClear=function(){var e=this;e.autoPlayTimer&&clearInterval(e.autoPlayTimer)},t.prototype.autoPlayIterator=function(){var e=this,t=e.currentSlide+e.options.slidesToScroll;e.paused||e.interrupted||e.focussed||(e.options.infinite===!1&&(1===e.direction&&e.currentSlide+1===e.slideCount-1?e.direction=0:0===e.direction&&(t=e.currentSlide-e.options.slidesToScroll,e.currentSlide-1===0&&(e.direction=1))),e.slideHandler(t))},t.prototype.buildArrows=function(){var t=this;t.options.arrows===!0&&(t.$prevArrow=e(t.options.prevArrow).addClass("slick-arrow"),t.$nextArrow=e(t.options.nextArrow).addClass("slick-arrow"),t.slideCount>t.options.slidesToShow?(t.$prevArrow.removeClass("slick-hidden").removeAttr("aria-hidden tabindex"),t.$nextArrow.removeClass("slick-hidden").removeAttr("aria-hidden tabindex"),t.htmlExpr.test(t.options.prevArrow)&&t.$prevArrow.prependTo(t.options.appendArrows),t.htmlExpr.test(t.options.nextArrow)&&t.$nextArrow.appendTo(t.options.appendArrows),t.options.infinite!==!0&&t.$prevArrow.addClass("slick-disabled").attr("aria-disabled","true")):t.$prevArrow.add(t.$nextArrow).addClass("slick-hidden").attr({"aria-disabled":"true",tabindex:"-1"}))},t.prototype.buildDots=function(){var t,i,o=this;if(o.options.dots===!0&&o.slideCount>o.options.slidesToShow){for(o.$slider.addClass("slick-dotted"),i=e("<ul />").addClass(o.options.dotsClass),t=0;t<=o.getDotCount();t+=1)i.append(e("<li />").append(o.options.customPaging.call(this,o,t)));o.$dots=i.appendTo(o.options.appendDots),o.$dots.find("li").first().addClass("slick-active").attr("aria-hidden","false")}},t.prototype.buildOut=function(){var t=this;t.$slides=t.$slider.children(t.options.slide+":not(.slick-cloned)").addClass("slick-slide"),t.slideCount=t.$slides.length,t.$slides.each(function(t,i){e(i).attr("data-slick-index",t).data("originalStyling",e(i).attr("style")||"")}),t.$slider.addClass("slick-slider"),t.$slideTrack=0===t.slideCount?e('<div class="slick-track"/>').appendTo(t.$slider):t.$slides.wrapAll('<div class="slick-track"/>').parent(),t.$list=t.$slideTrack.wrap('<div aria-live="polite" class="slick-list"/>').parent(),t.$slideTrack.css("opacity",0),(t.options.centerMode===!0||t.options.swipeToSlide===!0)&&(t.options.slidesToScroll=1),e("img[data-lazy]",t.$slider).not("[src]").addClass("slick-loading"),t.setupInfinite(),t.buildArrows(),t.buildDots(),t.updateDots(),t.setSlideClasses("number"==typeof t.currentSlide?t.currentSlide:0),t.options.draggable===!0&&t.$list.addClass("draggable")},t.prototype.buildRows=function(){var e,t,i,o,s,n,a,l=this;if(o=document.createDocumentFragment(),n=l.$slider.children(),l.options.rows>1){for(a=l.options.slidesPerRow*l.options.rows,s=Math.ceil(n.length/a),e=0;s>e;e++){var r=document.createElement("div");for(t=0;t<l.options.rows;t++){var d=document.createElement("div");for(i=0;i<l.options.slidesPerRow;i++){var c=e*a+(t*l.options.slidesPerRow+i);n.get(c)&&d.appendChild(n.get(c))}r.appendChild(d)}o.appendChild(r)}l.$slider.empty().append(o),l.$slider.children().children().children().css({width:100/l.options.slidesPerRow+"%",display:"inline-block"})}},t.prototype.checkResponsive=function(t,i){var o,s,n,a=this,l=!1,r=a.$slider.width(),d=window.innerWidth||e(window).width();if("window"===a.respondTo?n=d:"slider"===a.respondTo?n=r:"min"===a.respondTo&&(n=Math.min(d,r)),a.options.responsive&&a.options.responsive.length&&null!==a.options.responsive){s=null;for(o in a.breakpoints)a.breakpoints.hasOwnProperty(o)&&(a.originalSettings.mobileFirst===!1?n<a.breakpoints[o]&&(s=a.breakpoints[o]):n>a.breakpoints[o]&&(s=a.breakpoints[o]));null!==s?null!==a.activeBreakpoint?(s!==a.activeBreakpoint||i)&&(a.activeBreakpoint=s,"unslick"===a.breakpointSettings[s]?a.unslick(s):(a.options=e.extend({},a.originalSettings,a.breakpointSettings[s]),t===!0&&(a.currentSlide=a.options.initialSlide),a.refresh(t)),l=s):(a.activeBreakpoint=s,"unslick"===a.breakpointSettings[s]?a.unslick(s):(a.options=e.extend({},a.originalSettings,a.breakpointSettings[s]),t===!0&&(a.currentSlide=a.options.initialSlide),a.refresh(t)),l=s):null!==a.activeBreakpoint&&(a.activeBreakpoint=null,a.options=a.originalSettings,t===!0&&(a.currentSlide=a.options.initialSlide),a.refresh(t),l=s),t||l===!1||a.$slider.trigger("breakpoint",[a,l])}},t.prototype.changeSlide=function(t,i){var o,s,n,a=this,l=e(t.currentTarget);switch(l.is("a")&&t.preventDefault(),l.is("li")||(l=l.closest("li")),n=a.slideCount%a.options.slidesToScroll!==0,o=n?0:(a.slideCount-a.currentSlide)%a.options.slidesToScroll,t.data.message){case"previous":s=0===o?a.options.slidesToScroll:a.options.slidesToShow-o,a.slideCount>a.options.slidesToShow&&a.slideHandler(a.currentSlide-s,!1,i);break;case"next":s=0===o?a.options.slidesToScroll:o,a.slideCount>a.options.slidesToShow&&a.slideHandler(a.currentSlide+s,!1,i);break;case"index":var r=0===t.data.index?0:t.data.index||l.index()*a.options.slidesToScroll;a.slideHandler(a.checkNavigable(r),!1,i),l.children().trigger("focus");break;default:return}},t.prototype.checkNavigable=function(e){var t,i,o=this;if(t=o.getNavigableIndexes(),i=0,e>t[t.length-1])e=t[t.length-1];else for(var s in t){if(e<t[s]){e=i;break}i=t[s]}return e},t.prototype.cleanUpEvents=function(){var t=this;t.options.dots&&null!==t.$dots&&e("li",t.$dots).off("click.slick",t.changeSlide).off("mouseenter.slick",e.proxy(t.interrupt,t,!0)).off("mouseleave.slick",e.proxy(t.interrupt,t,!1)),t.$slider.off("focus.slick blur.slick"),t.options.arrows===!0&&t.slideCount>t.options.slidesToShow&&(t.$prevArrow&&t.$prevArrow.off("click.slick",t.changeSlide),t.$nextArrow&&t.$nextArrow.off("click.slick",t.changeSlide)),t.$list.off("touchstart.slick mousedown.slick",t.swipeHandler),t.$list.off("touchmove.slick mousemove.slick",t.swipeHandler),t.$list.off("touchend.slick mouseup.slick",t.swipeHandler),t.$list.off("touchcancel.slick mouseleave.slick",t.swipeHandler),t.$list.off("click.slick",t.clickHandler),e(document).off(t.visibilityChange,t.visibility),t.cleanUpSlideEvents(),t.options.accessibility===!0&&t.$list.off("keydown.slick",t.keyHandler),t.options.focusOnSelect===!0&&e(t.$slideTrack).children().off("click.slick",t.selectHandler),e(window).off("orientationchange.slick.slick-"+t.instanceUid,t.orientationChange),e(window).off("resize.slick.slick-"+t.instanceUid,t.resize),e("[draggable!=true]",t.$slideTrack).off("dragstart",t.preventDefault),e(window).off("load.slick.slick-"+t.instanceUid,t.setPosition),e(document).off("ready.slick.slick-"+t.instanceUid,t.setPosition)},t.prototype.cleanUpSlideEvents=function(){var t=this;t.$list.off("mouseenter.slick",e.proxy(t.interrupt,t,!0)),t.$list.off("mouseleave.slick",e.proxy(t.interrupt,t,!1))},t.prototype.cleanUpRows=function(){var e,t=this;t.options.rows>1&&(e=t.$slides.children().children(),e.removeAttr("style"),t.$slider.empty().append(e))},t.prototype.clickHandler=function(e){var t=this;t.shouldClick===!1&&(e.stopImmediatePropagation(),e.stopPropagation(),e.preventDefault())},t.prototype.destroy=function(t){var i=this;i.autoPlayClear(),i.touchObject={},i.cleanUpEvents(),e(".slick-cloned",i.$slider).detach(),i.$dots&&i.$dots.remove(),i.$prevArrow&&i.$prevArrow.length&&(i.$prevArrow.removeClass("slick-disabled slick-arrow slick-hidden").removeAttr("aria-hidden aria-disabled tabindex").css("display",""),i.htmlExpr.test(i.options.prevArrow)&&i.$prevArrow.remove()),i.$nextArrow&&i.$nextArrow.length&&(i.$nextArrow.removeClass("slick-disabled slick-arrow slick-hidden").removeAttr("aria-hidden aria-disabled tabindex").css("display",""),i.htmlExpr.test(i.options.nextArrow)&&i.$nextArrow.remove()),i.$slides&&(i.$slides.removeClass("slick-slide slick-active slick-center slick-visible slick-current").removeAttr("aria-hidden").removeAttr("data-slick-index").each(function(){e(this).attr("style",e(this).data("originalStyling"))}),i.$slideTrack.children(this.options.slide).detach(),i.$slideTrack.detach(),i.$list.detach(),i.$slider.append(i.$slides)),i.cleanUpRows(),i.$slider.removeClass("slick-slider"),i.$slider.removeClass("slick-initialized"),i.$slider.removeClass("slick-dotted"),i.unslicked=!0,t||i.$slider.trigger("destroy",[i])},t.prototype.disableTransition=function(e){var t=this,i={};i[t.transitionType]="",t.options.fade===!1?t.$slideTrack.css(i):t.$slides.eq(e).css(i)},t.prototype.fadeSlide=function(e,t){var i=this;i.cssTransitions===!1?(i.$slides.eq(e).css({zIndex:i.options.zIndex}),i.$slides.eq(e).animate({opacity:1},i.options.speed,i.options.easing,t)):(i.applyTransition(e),i.$slides.eq(e).css({opacity:1,zIndex:i.options.zIndex}),t&&setTimeout(function(){i.disableTransition(e),t.call()},i.options.speed))},t.prototype.fadeSlideOut=function(e){var t=this;t.cssTransitions===!1?t.$slides.eq(e).animate({opacity:0,zIndex:t.options.zIndex-2},t.options.speed,t.options.easing):(t.applyTransition(e),t.$slides.eq(e).css({opacity:0,zIndex:t.options.zIndex-2}))},t.prototype.filterSlides=t.prototype.slickFilter=function(e){var t=this;null!==e&&(t.$slidesCache=t.$slides,t.unload(),t.$slideTrack.children(this.options.slide).detach(),t.$slidesCache.filter(e).appendTo(t.$slideTrack),t.reinit())},t.prototype.focusHandler=function(){var t=this;t.$slider.off("focus.slick blur.slick").on("focus.slick blur.slick","*:not(.slick-arrow)",function(i){i.stopImmediatePropagation();var o=e(this);setTimeout(function(){t.options.pauseOnFocus&&(t.focussed=o.is(":focus"),t.autoPlay())},0)})},t.prototype.getCurrent=t.prototype.slickCurrentSlide=function(){var e=this;return e.currentSlide},t.prototype.getDotCount=function(){var e=this,t=0,i=0,o=0;if(e.options.infinite===!0)for(;t<e.slideCount;)++o,t=i+e.options.slidesToScroll,i+=e.options.slidesToScroll<=e.options.slidesToShow?e.options.slidesToScroll:e.options.slidesToShow;else if(e.options.centerMode===!0)o=e.slideCount;else if(e.options.asNavFor)for(;t<e.slideCount;)++o,t=i+e.options.slidesToScroll,i+=e.options.slidesToScroll<=e.options.slidesToShow?e.options.slidesToScroll:e.options.slidesToShow;else o=1+Math.ceil((e.slideCount-e.options.slidesToShow)/e.options.slidesToScroll);return o-1},t.prototype.getLeft=function(e){var t,i,o,s=this,n=0;return s.slideOffset=0,i=s.$slides.first().outerHeight(!0),s.options.infinite===!0?(s.slideCount>s.options.slidesToShow&&(s.slideOffset=s.slideWidth*s.options.slidesToShow*-1,n=i*s.options.slidesToShow*-1),s.slideCount%s.options.slidesToScroll!==0&&e+s.options.slidesToScroll>s.slideCount&&s.slideCount>s.options.slidesToShow&&(e>s.slideCount?(s.slideOffset=(s.options.slidesToShow-(e-s.slideCount))*s.slideWidth*-1,n=(s.options.slidesToShow-(e-s.slideCount))*i*-1):(s.slideOffset=s.slideCount%s.options.slidesToScroll*s.slideWidth*-1,n=s.slideCount%s.options.slidesToScroll*i*-1))):e+s.options.slidesToShow>s.slideCount&&(s.slideOffset=(e+s.options.slidesToShow-s.slideCount)*s.slideWidth,n=(e+s.options.slidesToShow-s.slideCount)*i),s.slideCount<=s.options.slidesToShow&&(s.slideOffset=0,n=0),s.options.centerMode===!0&&s.options.infinite===!0?s.slideOffset+=s.slideWidth*Math.floor(s.options.slidesToShow/2)-s.slideWidth:s.options.centerMode===!0&&(s.slideOffset=0,s.slideOffset+=s.slideWidth*Math.floor(s.options.slidesToShow/2)),t=s.options.vertical===!1?e*s.slideWidth*-1+s.slideOffset:e*i*-1+n,s.options.variableWidth===!0&&(o=s.slideCount<=s.options.slidesToShow||s.options.infinite===!1?s.$slideTrack.children(".slick-slide").eq(e):s.$slideTrack.children(".slick-slide").eq(e+s.options.slidesToShow),t=s.options.rtl===!0?o[0]?-1*(s.$slideTrack.width()-o[0].offsetLeft-o.width()):0:o[0]?-1*o[0].offsetLeft:0,s.options.centerMode===!0&&(o=s.slideCount<=s.options.slidesToShow||s.options.infinite===!1?s.$slideTrack.children(".slick-slide").eq(e):s.$slideTrack.children(".slick-slide").eq(e+s.options.slidesToShow+1),t=s.options.rtl===!0?o[0]?-1*(s.$slideTrack.width()-o[0].offsetLeft-o.width()):0:o[0]?-1*o[0].offsetLeft:0,t+=(s.$list.width()-o.outerWidth())/2)),t},t.prototype.getOption=t.prototype.slickGetOption=function(e){var t=this;return t.options[e]},t.prototype.getNavigableIndexes=function(){var e,t=this,i=0,o=0,s=[];for(t.options.infinite===!1?e=t.slideCount:(i=-1*t.options.slidesToScroll,o=-1*t.options.slidesToScroll,e=2*t.slideCount);e>i;)s.push(i),i=o+t.options.slidesToScroll,o+=t.options.slidesToScroll<=t.options.slidesToShow?t.options.slidesToScroll:t.options.slidesToShow;return s},t.prototype.getSlick=function(){return this},t.prototype.getSlideCount=function(){var t,i,o,s=this;return o=s.options.centerMode===!0?s.slideWidth*Math.floor(s.options.slidesToShow/2):0,s.options.swipeToSlide===!0?(s.$slideTrack.find(".slick-slide").each(function(t,n){return n.offsetLeft-o+e(n).outerWidth()/2>-1*s.swipeLeft?(i=n,!1):void 0}),t=Math.abs(e(i).attr("data-slick-index")-s.currentSlide)||1):s.options.slidesToScroll},t.prototype.goTo=t.prototype.slickGoTo=function(e,t){var i=this;i.changeSlide({data:{message:"index",index:parseInt(e)}},t)},t.prototype.init=function(t){var i=this;e(i.$slider).hasClass("slick-initialized")||(e(i.$slider).addClass("slick-initialized"),i.buildRows(),i.buildOut(),i.setProps(),i.startLoad(),i.loadSlider(),i.initializeEvents(),i.updateArrows(),i.updateDots(),i.checkResponsive(!0),i.focusHandler()),t&&i.$slider.trigger("init",[i]),i.options.accessibility===!0&&i.initADA(),i.options.autoplay&&(i.paused=!1,i.autoPlay())},t.prototype.initADA=function(){var t=this;t.$slides.add(t.$slideTrack.find(".slick-cloned")).attr({"aria-hidden":"true",tabindex:"-1"}).find("a, input, button, select").attr({tabindex:"-1"}),t.$slideTrack.attr("role","listbox"),t.$slides.not(t.$slideTrack.find(".slick-cloned")).each(function(i){e(this).attr({role:"option","aria-describedby":"slick-slide"+t.instanceUid+i})}),null!==t.$dots&&t.$dots.attr("role","tablist").find("li").each(function(i){e(this).attr({role:"presentation","aria-selected":"false","aria-controls":"navigation"+t.instanceUid+i,id:"slick-slide"+t.instanceUid+i})}).first().attr("aria-selected","true").end().find("button").attr("role","button").end().closest("div").attr("role","toolbar"),t.activateADA()},t.prototype.initArrowEvents=function(){var e=this;e.options.arrows===!0&&e.slideCount>e.options.slidesToShow&&(e.$prevArrow.off("click.slick").on("click.slick",{message:"previous"},e.changeSlide),e.$nextArrow.off("click.slick").on("click.slick",{message:"next"},e.changeSlide))},t.prototype.initDotEvents=function(){var t=this;t.options.dots===!0&&t.slideCount>t.options.slidesToShow&&e("li",t.$dots).on("click.slick",{message:"index"},t.changeSlide),t.options.dots===!0&&t.options.pauseOnDotsHover===!0&&e("li",t.$dots).on("mouseenter.slick",e.proxy(t.interrupt,t,!0)).on("mouseleave.slick",e.proxy(t.interrupt,t,!1))},t.prototype.initSlideEvents=function(){var t=this;t.options.pauseOnHover&&(t.$list.on("mouseenter.slick",e.proxy(t.interrupt,t,!0)),t.$list.on("mouseleave.slick",e.proxy(t.interrupt,t,!1)))},t.prototype.initializeEvents=function(){var t=this;t.initArrowEvents(),t.initDotEvents(),t.initSlideEvents(),t.$list.on("touchstart.slick mousedown.slick",{action:"start"},t.swipeHandler),t.$list.on("touchmove.slick mousemove.slick",{action:"move"},t.swipeHandler),t.$list.on("touchend.slick mouseup.slick",{action:"end"},t.swipeHandler),t.$list.on("touchcancel.slick mouseleave.slick",{action:"end"},t.swipeHandler),t.$list.on("click.slick",t.clickHandler),e(document).on(t.visibilityChange,e.proxy(t.visibility,t)),t.options.accessibility===!0&&t.$list.on("keydown.slick",t.keyHandler),t.options.focusOnSelect===!0&&e(t.$slideTrack).children().on("click.slick",t.selectHandler),e(window).on("orientationchange.slick.slick-"+t.instanceUid,e.proxy(t.orientationChange,t)),e(window).on("resize.slick.slick-"+t.instanceUid,e.proxy(t.resize,t)),e("[draggable!=true]",t.$slideTrack).on("dragstart",t.preventDefault),e(window).on("load.slick.slick-"+t.instanceUid,t.setPosition),e(document).on("ready.slick.slick-"+t.instanceUid,t.setPosition)},t.prototype.initUI=function(){var e=this;e.options.arrows===!0&&e.slideCount>e.options.slidesToShow&&(e.$prevArrow.show(),e.$nextArrow.show()),e.options.dots===!0&&e.slideCount>e.options.slidesToShow&&e.$dots.show()},t.prototype.keyHandler=function(e){var t=this;e.target.tagName.match("TEXTAREA|INPUT|SELECT")||(37===e.keyCode&&t.options.accessibility===!0?t.changeSlide({data:{message:t.options.rtl===!0?"next":"previous"}}):39===e.keyCode&&t.options.accessibility===!0&&t.changeSlide({
data:{message:t.options.rtl===!0?"previous":"next"}}))},t.prototype.lazyLoad=function(){function t(t){e("img[data-lazy]",t).each(function(){var t=e(this),i=e(this).attr("data-lazy"),o=document.createElement("img");o.onload=function(){t.animate({opacity:0},100,function(){t.attr("src",i).animate({opacity:1},200,function(){t.removeAttr("data-lazy").removeClass("slick-loading")}),a.$slider.trigger("lazyLoaded",[a,t,i])})},o.onerror=function(){t.removeAttr("data-lazy").removeClass("slick-loading").addClass("slick-lazyload-error"),a.$slider.trigger("lazyLoadError",[a,t,i])},o.src=i})}var i,o,s,n,a=this;a.options.centerMode===!0?a.options.infinite===!0?(s=a.currentSlide+(a.options.slidesToShow/2+1),n=s+a.options.slidesToShow+2):(s=Math.max(0,a.currentSlide-(a.options.slidesToShow/2+1)),n=2+(a.options.slidesToShow/2+1)+a.currentSlide):(s=a.options.infinite?a.options.slidesToShow+a.currentSlide:a.currentSlide,n=Math.ceil(s+a.options.slidesToShow),a.options.fade===!0&&(s>0&&s--,n<=a.slideCount&&n++)),i=a.$slider.find(".slick-slide").slice(s,n),t(i),a.slideCount<=a.options.slidesToShow?(o=a.$slider.find(".slick-slide"),t(o)):a.currentSlide>=a.slideCount-a.options.slidesToShow?(o=a.$slider.find(".slick-cloned").slice(0,a.options.slidesToShow),t(o)):0===a.currentSlide&&(o=a.$slider.find(".slick-cloned").slice(-1*a.options.slidesToShow),t(o))},t.prototype.loadSlider=function(){var e=this;e.setPosition(),e.$slideTrack.css({opacity:1}),e.$slider.removeClass("slick-loading"),e.initUI(),"progressive"===e.options.lazyLoad&&e.progressiveLazyLoad()},t.prototype.next=t.prototype.slickNext=function(){var e=this;e.changeSlide({data:{message:"next"}})},t.prototype.orientationChange=function(){var e=this;e.checkResponsive(),e.setPosition()},t.prototype.pause=t.prototype.slickPause=function(){var e=this;e.autoPlayClear(),e.paused=!0},t.prototype.play=t.prototype.slickPlay=function(){var e=this;e.autoPlay(),e.options.autoplay=!0,e.paused=!1,e.focussed=!1,e.interrupted=!1},t.prototype.postSlide=function(e){var t=this;t.unslicked||(t.$slider.trigger("afterChange",[t,e]),t.animating=!1,t.setPosition(),t.swipeLeft=null,t.options.autoplay&&t.autoPlay(),t.options.accessibility===!0&&t.initADA())},t.prototype.prev=t.prototype.slickPrev=function(){var e=this;e.changeSlide({data:{message:"previous"}})},t.prototype.preventDefault=function(e){e.preventDefault()},t.prototype.progressiveLazyLoad=function(t){t=t||1;var i,o,s,n=this,a=e("img[data-lazy]",n.$slider);a.length?(i=a.first(),o=i.attr("data-lazy"),s=document.createElement("img"),s.onload=function(){i.attr("src",o).removeAttr("data-lazy").removeClass("slick-loading"),n.options.adaptiveHeight===!0&&n.setPosition(),n.$slider.trigger("lazyLoaded",[n,i,o]),n.progressiveLazyLoad()},s.onerror=function(){3>t?setTimeout(function(){n.progressiveLazyLoad(t+1)},500):(i.removeAttr("data-lazy").removeClass("slick-loading").addClass("slick-lazyload-error"),n.$slider.trigger("lazyLoadError",[n,i,o]),n.progressiveLazyLoad())},s.src=o):n.$slider.trigger("allImagesLoaded",[n])},t.prototype.refresh=function(t){var i,o,s=this;o=s.slideCount-s.options.slidesToShow,!s.options.infinite&&s.currentSlide>o&&(s.currentSlide=o),s.slideCount<=s.options.slidesToShow&&(s.currentSlide=0),i=s.currentSlide,s.destroy(!0),e.extend(s,s.initials,{currentSlide:i}),s.init(),t||s.changeSlide({data:{message:"index",index:i}},!1)},t.prototype.registerBreakpoints=function(){var t,i,o,s=this,n=s.options.responsive||null;if("array"===e.type(n)&&n.length){s.respondTo=s.options.respondTo||"window";for(t in n)if(o=s.breakpoints.length-1,i=n[t].breakpoint,n.hasOwnProperty(t)){for(;o>=0;)s.breakpoints[o]&&s.breakpoints[o]===i&&s.breakpoints.splice(o,1),o--;s.breakpoints.push(i),s.breakpointSettings[i]=n[t].settings}s.breakpoints.sort(function(e,t){return s.options.mobileFirst?e-t:t-e})}},t.prototype.reinit=function(){var t=this;t.$slides=t.$slideTrack.children(t.options.slide).addClass("slick-slide"),t.slideCount=t.$slides.length,t.currentSlide>=t.slideCount&&0!==t.currentSlide&&(t.currentSlide=t.currentSlide-t.options.slidesToScroll),t.slideCount<=t.options.slidesToShow&&(t.currentSlide=0),t.registerBreakpoints(),t.setProps(),t.setupInfinite(),t.buildArrows(),t.updateArrows(),t.initArrowEvents(),t.buildDots(),t.updateDots(),t.initDotEvents(),t.cleanUpSlideEvents(),t.initSlideEvents(),t.checkResponsive(!1,!0),t.options.focusOnSelect===!0&&e(t.$slideTrack).children().on("click.slick",t.selectHandler),t.setSlideClasses("number"==typeof t.currentSlide?t.currentSlide:0),t.setPosition(),t.focusHandler(),t.paused=!t.options.autoplay,t.autoPlay(),t.$slider.trigger("reInit",[t])},t.prototype.resize=function(){var t=this;e(window).width()!==t.windowWidth&&(clearTimeout(t.windowDelay),t.windowDelay=window.setTimeout(function(){t.windowWidth=e(window).width(),t.checkResponsive(),t.unslicked||t.setPosition()},50))},t.prototype.removeSlide=t.prototype.slickRemove=function(e,t,i){var o=this;return"boolean"==typeof e?(t=e,e=t===!0?0:o.slideCount-1):e=t===!0?--e:e,!(o.slideCount<1||0>e||e>o.slideCount-1)&&(o.unload(),i===!0?o.$slideTrack.children().remove():o.$slideTrack.children(this.options.slide).eq(e).remove(),o.$slides=o.$slideTrack.children(this.options.slide),o.$slideTrack.children(this.options.slide).detach(),o.$slideTrack.append(o.$slides),o.$slidesCache=o.$slides,void o.reinit())},t.prototype.setCSS=function(e){var t,i,o=this,s={};o.options.rtl===!0&&(e=-e),t="left"==o.positionProp?Math.ceil(e)+"px":"0px",i="top"==o.positionProp?Math.ceil(e)+"px":"0px",s[o.positionProp]=e,o.transformsEnabled===!1?o.$slideTrack.css(s):(s={},o.cssTransitions===!1?(s[o.animType]="translate("+t+", "+i+")",o.$slideTrack.css(s)):(s[o.animType]="translate3d("+t+", "+i+", 0px)",o.$slideTrack.css(s)))},t.prototype.setDimensions=function(){var e=this;e.options.vertical===!1?e.options.centerMode===!0&&e.$list.css({padding:"0px "+e.options.centerPadding}):(e.$list.height(e.$slides.first().outerHeight(!0)*e.options.slidesToShow),e.options.centerMode===!0&&e.$list.css({padding:e.options.centerPadding+" 0px"})),e.listWidth=e.$list.width(),e.listHeight=e.$list.height(),e.options.vertical===!1&&e.options.variableWidth===!1?(e.slideWidth=Math.ceil(e.listWidth/e.options.slidesToShow),e.$slideTrack.width(Math.ceil(e.slideWidth*e.$slideTrack.children(".slick-slide").length))):e.options.variableWidth===!0?e.$slideTrack.width(5e3*e.slideCount):(e.slideWidth=Math.ceil(e.listWidth),e.$slideTrack.height(Math.ceil(e.$slides.first().outerHeight(!0)*e.$slideTrack.children(".slick-slide").length)));var t=e.$slides.first().outerWidth(!0)-e.$slides.first().width();e.options.variableWidth===!1&&e.$slideTrack.children(".slick-slide").width(e.slideWidth-t)},t.prototype.setFade=function(){var t,i=this;i.$slides.each(function(o,s){t=i.slideWidth*o*-1,i.options.rtl===!0?e(s).css({position:"relative",right:t,top:0,zIndex:i.options.zIndex-2,opacity:0}):e(s).css({position:"relative",left:t,top:0,zIndex:i.options.zIndex-2,opacity:0})}),i.$slides.eq(i.currentSlide).css({zIndex:i.options.zIndex-1,opacity:1})},t.prototype.setHeight=function(){var e=this;if(1===e.options.slidesToShow&&e.options.adaptiveHeight===!0&&e.options.vertical===!1){var t=e.$slides.eq(e.currentSlide).outerHeight(!0);e.$list.css("height",t)}},t.prototype.setOption=t.prototype.slickSetOption=function(){var t,i,o,s,n,a=this,l=!1;if("object"===e.type(arguments[0])?(o=arguments[0],l=arguments[1],n="multiple"):"string"===e.type(arguments[0])&&(o=arguments[0],s=arguments[1],l=arguments[2],"responsive"===arguments[0]&&"array"===e.type(arguments[1])?n="responsive":"undefined"!=typeof arguments[1]&&(n="single")),"single"===n)a.options[o]=s;else if("multiple"===n)e.each(o,function(e,t){a.options[e]=t});else if("responsive"===n)for(i in s)if("array"!==e.type(a.options.responsive))a.options.responsive=[s[i]];else{for(t=a.options.responsive.length-1;t>=0;)a.options.responsive[t].breakpoint===s[i].breakpoint&&a.options.responsive.splice(t,1),t--;a.options.responsive.push(s[i])}l&&(a.unload(),a.reinit())},t.prototype.setPosition=function(){var e=this;e.setDimensions(),e.setHeight(),e.options.fade===!1?e.setCSS(e.getLeft(e.currentSlide)):e.setFade(),e.$slider.trigger("setPosition",[e])},t.prototype.setProps=function(){var e=this,t=document.body.style;e.positionProp=e.options.vertical===!0?"top":"left","top"===e.positionProp?e.$slider.addClass("slick-vertical"):e.$slider.removeClass("slick-vertical"),(void 0!==t.WebkitTransition||void 0!==t.MozTransition||void 0!==t.msTransition)&&e.options.useCSS===!0&&(e.cssTransitions=!0),e.options.fade&&("number"==typeof e.options.zIndex?e.options.zIndex<3&&(e.options.zIndex=3):e.options.zIndex=e.defaults.zIndex),void 0!==t.OTransform&&(e.animType="OTransform",e.transformType="-o-transform",e.transitionType="OTransition",void 0===t.perspectiveProperty&&void 0===t.webkitPerspective&&(e.animType=!1)),void 0!==t.MozTransform&&(e.animType="MozTransform",e.transformType="-moz-transform",e.transitionType="MozTransition",void 0===t.perspectiveProperty&&void 0===t.MozPerspective&&(e.animType=!1)),void 0!==t.webkitTransform&&(e.animType="webkitTransform",e.transformType="-webkit-transform",e.transitionType="webkitTransition",void 0===t.perspectiveProperty&&void 0===t.webkitPerspective&&(e.animType=!1)),void 0!==t.msTransform&&(e.animType="msTransform",e.transformType="-ms-transform",e.transitionType="msTransition",void 0===t.msTransform&&(e.animType=!1)),void 0!==t.transform&&e.animType!==!1&&(e.animType="transform",e.transformType="transform",e.transitionType="transition"),e.transformsEnabled=e.options.useTransform&&null!==e.animType&&e.animType!==!1},t.prototype.setSlideClasses=function(e){var t,i,o,s,n=this;i=n.$slider.find(".slick-slide").removeClass("slick-active slick-center slick-current").attr("aria-hidden","true"),n.$slides.eq(e).addClass("slick-current"),n.options.centerMode===!0?(t=Math.floor(n.options.slidesToShow/2),n.options.infinite===!0&&(e>=t&&e<=n.slideCount-1-t?n.$slides.slice(e-t,e+t+1).addClass("slick-active").attr("aria-hidden","false"):(o=n.options.slidesToShow+e,i.slice(o-t+1,o+t+2).addClass("slick-active").attr("aria-hidden","false")),0===e?i.eq(i.length-1-n.options.slidesToShow).addClass("slick-center"):e===n.slideCount-1&&i.eq(n.options.slidesToShow).addClass("slick-center")),n.$slides.eq(e).addClass("slick-center")):e>=0&&e<=n.slideCount-n.options.slidesToShow?n.$slides.slice(e,e+n.options.slidesToShow).addClass("slick-active").attr("aria-hidden","false"):i.length<=n.options.slidesToShow?i.addClass("slick-active").attr("aria-hidden","false"):(s=n.slideCount%n.options.slidesToShow,o=n.options.infinite===!0?n.options.slidesToShow+e:e,n.options.slidesToShow==n.options.slidesToScroll&&n.slideCount-e<n.options.slidesToShow?i.slice(o-(n.options.slidesToShow-s),o+s).addClass("slick-active").attr("aria-hidden","false"):i.slice(o,o+n.options.slidesToShow).addClass("slick-active").attr("aria-hidden","false")),"ondemand"===n.options.lazyLoad&&n.lazyLoad()},t.prototype.setupInfinite=function(){var t,i,o,s=this;if(s.options.fade===!0&&(s.options.centerMode=!1),s.options.infinite===!0&&s.options.fade===!1&&(i=null,s.slideCount>s.options.slidesToShow)){for(o=s.options.centerMode===!0?s.options.slidesToShow+1:s.options.slidesToShow,t=s.slideCount;t>s.slideCount-o;t-=1)i=t-1,e(s.$slides[i]).clone(!0).attr("id","").attr("data-slick-index",i-s.slideCount).prependTo(s.$slideTrack).addClass("slick-cloned");for(t=0;o>t;t+=1)i=t,e(s.$slides[i]).clone(!0).attr("id","").attr("data-slick-index",i+s.slideCount).appendTo(s.$slideTrack).addClass("slick-cloned");s.$slideTrack.find(".slick-cloned").find("[id]").each(function(){e(this).attr("id","")})}},t.prototype.interrupt=function(e){var t=this;e||t.autoPlay(),t.interrupted=e},t.prototype.selectHandler=function(t){var i=this,o=e(t.target).is(".slick-slide")?e(t.target):e(t.target).parents(".slick-slide"),s=parseInt(o.attr("data-slick-index"));return s||(s=0),i.slideCount<=i.options.slidesToShow?(i.setSlideClasses(s),void i.asNavFor(s)):void i.slideHandler(s)},t.prototype.slideHandler=function(e,t,i){var o,s,n,a,l,r=null,d=this;return t=t||!1,d.animating===!0&&d.options.waitForAnimate===!0||d.options.fade===!0&&d.currentSlide===e||d.slideCount<=d.options.slidesToShow?void 0:(t===!1&&d.asNavFor(e),o=e,r=d.getLeft(o),a=d.getLeft(d.currentSlide),d.currentLeft=null===d.swipeLeft?a:d.swipeLeft,d.options.infinite===!1&&d.options.centerMode===!1&&(0>e||e>d.getDotCount()*d.options.slidesToScroll)?void(d.options.fade===!1&&(o=d.currentSlide,i!==!0?d.animateSlide(a,function(){d.postSlide(o)}):d.postSlide(o))):d.options.infinite===!1&&d.options.centerMode===!0&&(0>e||e>d.slideCount-d.options.slidesToScroll)?void(d.options.fade===!1&&(o=d.currentSlide,i!==!0?d.animateSlide(a,function(){d.postSlide(o)}):d.postSlide(o))):(d.options.autoplay&&clearInterval(d.autoPlayTimer),s=0>o?d.slideCount%d.options.slidesToScroll!==0?d.slideCount-d.slideCount%d.options.slidesToScroll:d.slideCount+o:o>=d.slideCount?d.slideCount%d.options.slidesToScroll!==0?0:o-d.slideCount:o,d.animating=!0,d.$slider.trigger("beforeChange",[d,d.currentSlide,s]),n=d.currentSlide,d.currentSlide=s,d.setSlideClasses(d.currentSlide),d.options.asNavFor&&(l=d.getNavTarget(),l=l.slick("getSlick"),l.slideCount<=l.options.slidesToShow&&l.setSlideClasses(d.currentSlide)),d.updateDots(),d.updateArrows(),d.options.fade===!0?(i!==!0?(d.fadeSlideOut(n),d.fadeSlide(s,function(){d.postSlide(s)})):d.postSlide(s),void d.animateHeight()):void(i!==!0?d.animateSlide(r,function(){d.postSlide(s)}):d.postSlide(s))))},t.prototype.startLoad=function(){var e=this;e.options.arrows===!0&&e.slideCount>e.options.slidesToShow&&(e.$prevArrow.hide(),e.$nextArrow.hide()),e.options.dots===!0&&e.slideCount>e.options.slidesToShow&&e.$dots.hide(),e.$slider.addClass("slick-loading")},t.prototype.swipeDirection=function(){var e,t,i,o,s=this;return e=s.touchObject.startX-s.touchObject.curX,t=s.touchObject.startY-s.touchObject.curY,i=Math.atan2(t,e),o=Math.round(180*i/Math.PI),0>o&&(o=360-Math.abs(o)),45>=o&&o>=0?s.options.rtl===!1?"left":"right":360>=o&&o>=315?s.options.rtl===!1?"left":"right":o>=135&&225>=o?s.options.rtl===!1?"right":"left":s.options.verticalSwiping===!0?o>=35&&135>=o?"down":"up":"vertical"},t.prototype.swipeEnd=function(e){var t,i,o=this;if(o.dragging=!1,o.interrupted=!1,o.shouldClick=!(o.touchObject.swipeLength>10),void 0===o.touchObject.curX)return!1;if(o.touchObject.edgeHit===!0&&o.$slider.trigger("edge",[o,o.swipeDirection()]),o.touchObject.swipeLength>=o.touchObject.minSwipe){switch(i=o.swipeDirection()){case"left":case"down":t=o.options.swipeToSlide?o.checkNavigable(o.currentSlide+o.getSlideCount()):o.currentSlide+o.getSlideCount(),o.currentDirection=0;break;case"right":case"up":t=o.options.swipeToSlide?o.checkNavigable(o.currentSlide-o.getSlideCount()):o.currentSlide-o.getSlideCount(),o.currentDirection=1}"vertical"!=i&&(o.slideHandler(t),o.touchObject={},o.$slider.trigger("swipe",[o,i]))}else o.touchObject.startX!==o.touchObject.curX&&(o.slideHandler(o.currentSlide),o.touchObject={})},t.prototype.swipeHandler=function(e){var t=this;if(!(t.options.swipe===!1||"ontouchend"in document&&t.options.swipe===!1||t.options.draggable===!1&&-1!==e.type.indexOf("mouse")))switch(t.touchObject.fingerCount=e.originalEvent&&void 0!==e.originalEvent.touches?e.originalEvent.touches.length:1,t.touchObject.minSwipe=t.listWidth/t.options.touchThreshold,t.options.verticalSwiping===!0&&(t.touchObject.minSwipe=t.listHeight/t.options.touchThreshold),e.data.action){case"start":t.swipeStart(e);break;case"move":t.swipeMove(e);break;case"end":t.swipeEnd(e)}},t.prototype.swipeMove=function(e){var t,i,o,s,n,a=this;return n=void 0!==e.originalEvent?e.originalEvent.touches:null,!(!a.dragging||n&&1!==n.length)&&(t=a.getLeft(a.currentSlide),a.touchObject.curX=void 0!==n?n[0].pageX:e.clientX,a.touchObject.curY=void 0!==n?n[0].pageY:e.clientY,a.touchObject.swipeLength=Math.round(Math.sqrt(Math.pow(a.touchObject.curX-a.touchObject.startX,2))),a.options.verticalSwiping===!0&&(a.touchObject.swipeLength=Math.round(Math.sqrt(Math.pow(a.touchObject.curY-a.touchObject.startY,2)))),i=a.swipeDirection(),"vertical"!==i?(void 0!==e.originalEvent&&a.touchObject.swipeLength>4&&e.preventDefault(),s=(a.options.rtl===!1?1:-1)*(a.touchObject.curX>a.touchObject.startX?1:-1),a.options.verticalSwiping===!0&&(s=a.touchObject.curY>a.touchObject.startY?1:-1),o=a.touchObject.swipeLength,a.touchObject.edgeHit=!1,a.options.infinite===!1&&(0===a.currentSlide&&"right"===i||a.currentSlide>=a.getDotCount()&&"left"===i)&&(o=a.touchObject.swipeLength*a.options.edgeFriction,a.touchObject.edgeHit=!0),a.options.vertical===!1?a.swipeLeft=t+o*s:a.swipeLeft=t+o*(a.$list.height()/a.listWidth)*s,a.options.verticalSwiping===!0&&(a.swipeLeft=t+o*s),a.options.fade!==!0&&a.options.touchMove!==!1&&(a.animating===!0?(a.swipeLeft=null,!1):void a.setCSS(a.swipeLeft))):void 0)},t.prototype.swipeStart=function(e){var t,i=this;return i.interrupted=!0,1!==i.touchObject.fingerCount||i.slideCount<=i.options.slidesToShow?(i.touchObject={},!1):(void 0!==e.originalEvent&&void 0!==e.originalEvent.touches&&(t=e.originalEvent.touches[0]),i.touchObject.startX=i.touchObject.curX=void 0!==t?t.pageX:e.clientX,i.touchObject.startY=i.touchObject.curY=void 0!==t?t.pageY:e.clientY,void(i.dragging=!0))},t.prototype.unfilterSlides=t.prototype.slickUnfilter=function(){var e=this;null!==e.$slidesCache&&(e.unload(),e.$slideTrack.children(this.options.slide).detach(),e.$slidesCache.appendTo(e.$slideTrack),e.reinit())},t.prototype.unload=function(){var t=this;e(".slick-cloned",t.$slider).remove(),t.$dots&&t.$dots.remove(),t.$prevArrow&&t.htmlExpr.test(t.options.prevArrow)&&t.$prevArrow.remove(),t.$nextArrow&&t.htmlExpr.test(t.options.nextArrow)&&t.$nextArrow.remove(),t.$slides.removeClass("slick-slide slick-active slick-visible slick-current").attr("aria-hidden","true").css("width","")},t.prototype.unslick=function(e){var t=this;t.$slider.trigger("unslick",[t,e]),t.destroy()},t.prototype.updateArrows=function(){var e,t=this;e=Math.floor(t.options.slidesToShow/2),t.options.arrows===!0&&t.slideCount>t.options.slidesToShow&&!t.options.infinite&&(t.$prevArrow.removeClass("slick-disabled").attr("aria-disabled","false"),t.$nextArrow.removeClass("slick-disabled").attr("aria-disabled","false"),0===t.currentSlide?(t.$prevArrow.addClass("slick-disabled").attr("aria-disabled","true"),t.$nextArrow.removeClass("slick-disabled").attr("aria-disabled","false")):t.currentSlide>=t.slideCount-t.options.slidesToShow&&t.options.centerMode===!1?(t.$nextArrow.addClass("slick-disabled").attr("aria-disabled","true"),t.$prevArrow.removeClass("slick-disabled").attr("aria-disabled","false")):t.currentSlide>=t.slideCount-1&&t.options.centerMode===!0&&(t.$nextArrow.addClass("slick-disabled").attr("aria-disabled","true"),t.$prevArrow.removeClass("slick-disabled").attr("aria-disabled","false")))},t.prototype.updateDots=function(){var e=this;null!==e.$dots&&(e.$dots.find("li").removeClass("slick-active").attr("aria-hidden","true"),e.$dots.find("li").eq(Math.floor(e.currentSlide/e.options.slidesToScroll)).addClass("slick-active").attr("aria-hidden","false"))},t.prototype.visibility=function(){var e=this;e.options.autoplay&&(document[e.hidden]?e.interrupted=!0:e.interrupted=!1)},e.fn.slick=function(){var e,i,o=this,s=arguments[0],n=Array.prototype.slice.call(arguments,1),a=o.length;for(e=0;a>e;e++)if("object"==typeof s||"undefined"==typeof s?o[e].slick=new t(o[e],s):i=o[e].slick[s].apply(o[e].slick,n),"undefined"!=typeof i)return i;return o}}),!function(e,t){"use strict";var i=function(){var i={bcClass:"sf-breadcrumb",menuClass:"sf-js-enabled",anchorClass:"sf-with-ul",menuArrowClass:"sf-arrows"},o=function(){var t=/^(?![\w\W]*Windows Phone)[\w\W]*(iPhone|iPad|iPod)/i.test(navigator.userAgent);return t&&e("html").css("cursor","pointer").on("click",e.noop),t}(),s=function(){var e=document.documentElement.style;return"behavior"in e&&"fill"in e&&/iemobile/i.test(navigator.userAgent)}(),n=function(){return!!t.PointerEvent}(),a=function(e,t,o){var s,n=i.menuClass;t.cssArrows&&(n+=" "+i.menuArrowClass),s=o?"addClass":"removeClass",e[s](n)},l=function(t,o){return t.find("li."+o.pathClass).slice(0,o.pathLevels).addClass(o.hoverClass+" "+i.bcClass).filter(function(){return e(this).children(o.popUpSelector).hide().show().length}).removeClass(o.pathClass)},r=function(e,t){var o=t?"addClass":"removeClass";e.children("a")[o](i.anchorClass)},d=function(e){var t=e.css("ms-touch-action"),i=e.css("touch-action");i=i||t,i="pan-y"===i?"auto":"pan-y",e.css({"ms-touch-action":i,"touch-action":i})},c=function(e){return e.closest("."+i.menuClass)},u=function(e){return c(e).data("sfOptions")},h=function(){var t=e(this),i=u(t);clearTimeout(i.sfTimer),t.siblings().superfish("hide").end().superfish("show")},p=function(t){t.retainPath=e.inArray(this[0],t.$path)>-1,this.superfish("hide"),this.parents("."+t.hoverClass).length||(t.onIdle.call(c(this)),t.$path.length&&e.proxy(h,t.$path)())},f=function(){var t=e(this),i=u(t);o?e.proxy(p,t,i)():(clearTimeout(i.sfTimer),i.sfTimer=setTimeout(e.proxy(p,t,i),i.delay))},v=function(t){var i=e(this),o=u(i),s=i.siblings(t.data.popUpSelector);return o.onHandleTouch.call(s)===!1?this:void(s.length>0&&s.is(":hidden")&&(i.one("click.superfish",!1),"MSPointerDown"===t.type||"pointerdown"===t.type?i.trigger("focus"):e.proxy(h,i.parent("li"))()))},m=function(t,i){var a="li:has("+i.popUpSelector+")";e.fn.hoverIntent&&!i.disableHI?t.hoverIntent(h,f,a):t.on("mouseenter.superfish",a,h).on("mouseleave.superfish",a,f);var l="MSPointerDown.superfish";n&&(l="pointerdown.superfish"),o||(l+=" touchend.superfish"),s&&(l+=" mousedown.superfish"),t.on("focusin.superfish","li",h).on("focusout.superfish","li",f).on(l,"a",i,v)};return{hide:function(t){if(this.length){var i=this,o=u(i);if(!o)return this;var s=o.retainPath===!0?o.$path:"",n=i.find("li."+o.hoverClass).add(this).not(s).removeClass(o.hoverClass).children(o.popUpSelector),a=o.speedOut;if(t&&(n.show(),a=0),o.retainPath=!1,o.onBeforeHide.call(n)===!1)return this;n.stop(!0,!0).animate(o.animationOut,a,function(){var t=e(this);o.onHide.call(t)})}return this},show:function(){var e=u(this);if(!e)return this;var t=this.addClass(e.hoverClass),i=t.children(e.popUpSelector);return e.onBeforeShow.call(i)===!1?this:(i.stop(!0,!0).animate(e.animation,e.speed,function(){e.onShow.call(i)}),this)},destroy:function(){return this.each(function(){var t,o=e(this),s=o.data("sfOptions");return!!s&&(t=o.find(s.popUpSelector).parent("li"),clearTimeout(s.sfTimer),a(o,s),r(t),d(o),o.off(".superfish").off(".hoverIntent"),t.children(s.popUpSelector).attr("style",function(e,t){return t.replace(/display[^;]+;?/g,"")}),s.$path.removeClass(s.hoverClass+" "+i.bcClass).addClass(s.pathClass),o.find("."+s.hoverClass).removeClass(s.hoverClass),s.onDestroy.call(o),void o.removeData("sfOptions"))})},init:function(t){return this.each(function(){var o=e(this);if(o.data("sfOptions"))return!1;var s=e.extend({},e.fn.superfish.defaults,t),n=o.find(s.popUpSelector).parent("li");s.$path=l(o,s),o.data("sfOptions",s),a(o,s,!0),r(n,!0),d(o),m(o,s),n.not("."+i.bcClass).superfish("hide",!0),s.onInit.call(this)})}}}();e.fn.superfish=function(t,o){return i[t]?i[t].apply(this,Array.prototype.slice.call(arguments,1)):"object"!=typeof t&&t?e.error("Method "+t+" does not exist on jQuery.fn.superfish"):i.init.apply(this,arguments)},e.fn.superfish.defaults={popUpSelector:"ul,.sf-mega",hoverClass:"sfHover",pathClass:"overrideThisToUse",pathLevels:1,delay:800,animation:{opacity:"show"},animationOut:{opacity:"hide"},speed:"normal",speedOut:"fast",cssArrows:!0,disableHI:!1,onInit:e.noop,onBeforeShow:e.noop,onShow:e.noop,onBeforeHide:e.noop,onHide:e.noop,onIdle:e.noop,onDestroy:e.noop,onHandleTouch:e.noop}}(jQuery,window);



(function(window,document,$,undefined){"use strict";var H=$("html"),W=$(window),D=$(document),F=$.fancybox=function(){F.open.apply(this,arguments);},IE=navigator.userAgent.match(/msie/i),didUpdate=null,isTouch=document.createTouch!==undefined,isQuery=function(obj){return obj&&obj.hasOwnProperty&&obj instanceof $;},isString=function(str){return str&&$.type(str)==="string";},isPercentage=function(str){return isString(str)&&str.indexOf('%')>0;},isScrollable=function(el){return(el&&!(el.style.overflow&&el.style.overflow==='hidden')&&((el.clientWidth&&el.scrollWidth>el.clientWidth)||(el.clientHeight&&el.scrollHeight>el.clientHeight)));},getScalar=function(orig,dim){var value=parseInt(orig,10)||0;if(dim&&isPercentage(orig)){value=F.getViewport()[dim]/100*value;}return Math.ceil(value);},getValue=function(value,dim){return getScalar(value,dim)+'px';};$.extend(F,{version:'2.1.5',defaults:{padding:15,margin:20,width:800,height:600,minWidth:100,minHeight:100,maxWidth:9999,maxHeight:9999,pixelRatio:1,autoSize:true,autoHeight:false,autoWidth:false,autoResize:true,autoCenter:!isTouch,fitToView:true,aspectRatio:false,topRatio:0.5,leftRatio:0.5,scrolling:'auto',wrapCSS:'',arrows:true,closeBtn:true,closeClick:false,nextClick:false,mouseWheel:true,autoPlay:false,playSpeed:3000,preload:3,modal:false,loop:true,ajax:{dataType:'html',headers:{'X-fancyBox':true}},iframe:{scrolling:'auto',preload:true},swf:{wmode:'transparent',allowfullscreen:'true',allowscriptaccess:'always'},keys:{next:{13:'left',34:'up',39:'left',40:'up'},prev:{8:'right',33:'down',37:'right',38:'down'},close:[27],play:[32],toggle:[70]},direction:{next:'left',prev:'right'},scrollOutside:true,index:0,type:null,href:null,content:null,title:null,tpl:{wrap:'<div class="fancybox-wrap" tabIndex="-1"><div class="fancybox-skin"><div class="fancybox-outer"><div class="fancybox-inner"></div></div></div></div>',image:'<img class="fancybox-image" src="{href}" alt="" />',iframe:'<iframe id="fancybox-frame{rnd}" name="fancybox-frame{rnd}" class="fancybox-iframe" frameborder="0" vspace="0" hspace="0" webkitAllowFullScreen mozallowfullscreen allowFullScreen'+(IE?' allowtransparency="true"':'')+'></iframe>',error:'<p class="fancybox-error">The requested content cannot be loaded.<br/>Please try again later.</p>',closeBtn:'<a title="Закрыть" class="fancybox-item fancybox-close" href="javascript:;"></a>',next:'<a title="Next" class="fancybox-nav fancybox-next" href="javascript:;"><span></span></a>',prev:'<a title="Previous" class="fancybox-nav fancybox-prev" href="javascript:;"><span></span></a>'},openEffect:'fade',openSpeed:250,openEasing:'swing',openOpacity:true,openMethod:'zoomIn',closeEffect:'fade',closeSpeed:250,closeEasing:'swing',closeOpacity:true,closeMethod:'zoomOut',nextEffect:'elastic',nextSpeed:250,nextEasing:'swing',nextMethod:'changeIn',prevEffect:'elastic',prevSpeed:250,prevEasing:'swing',prevMethod:'changeOut',helpers:{overlay:true,title:true},onCancel:$.noop,beforeLoad:$.noop,afterLoad:$.noop,beforeShow:$.noop,afterShow:$.noop,beforeChange:$.noop,beforeClose:$.noop,afterClose:$.noop},group:{},opts:{},previous:null,coming:null,current:null,isActive:false,isOpen:false,isOpened:false,wrap:null,skin:null,outer:null,inner:null,player:{timer:null,isActive:false},ajaxLoad:null,imgPreload:null,transitions:{},helpers:{},open:function(group,opts){if(!group){return;}if(!$.isPlainObject(opts)){opts={};}if(false===F.close(true)){return;}if(!$.isArray(group)){group=isQuery(group)?$(group).get():[group];}$.each(group,function(i,element){var obj={},href,title,content,type,rez,hrefParts,selector;if($.type(element)==="object"){if(element.nodeType){element=$(element);}if(isQuery(element)){obj={href:element.data('fancybox-href')||element.attr('href'),title:element.data('fancybox-title')||element.attr('title'),isDom:true,element:element};if($.metadata){$.extend(true,obj,element.metadata());}}else{obj=element;}}href=opts.href||obj.href||(isString(element)?element:null);title=opts.title!==undefined?opts.title:obj.title||'';content=opts.content||obj.content;type=content?'html':(opts.type||obj.type);if(!type&&obj.isDom){type=element.data('fancybox-type');if(!type){rez=element.prop('class').match(/fancybox\.(\w+)/);type=rez?rez[1]:null;}}if(isString(href)){if(!type){if(F.isImage(href)){type='image';}else if(F.isSWF(href)){type='swf';}else if(href.charAt(0)==='#'){type='inline';}else if(isString(element)){type='html';content=element;}}if(type==='ajax'){hrefParts=href.split(/\s+/,2);href=hrefParts.shift();selector=hrefParts.shift();}}if(!content){if(type==='inline'){if(href){content=$(isString(href)?href.replace(/.*(?=#[^\s]+$)/,''):href);}else if(obj.isDom){content=element;}}else if(type==='html'){content=href;}else if(!type&&!href&&obj.isDom){type='inline';content=element;}}$.extend(obj,{href:href,type:type,content:content,title:title,selector:selector});group[i]=obj;});F.opts=$.extend(true,{},F.defaults,opts);if(opts.keys!==undefined){F.opts.keys=opts.keys?$.extend({},F.defaults.keys,opts.keys):false;}F.group=group;return F._start(F.opts.index);},cancel:function(){var coming=F.coming;if(!coming||false===F.trigger('onCancel')){return;}F.hideLoading();if(F.ajaxLoad){F.ajaxLoad.abort();}F.ajaxLoad=null;if(F.imgPreload){F.imgPreload.onload=F.imgPreload.onerror=null;}if(coming.wrap){coming.wrap.stop(true,true).trigger('onReset').remove();}F.coming=null;if(!F.current){F._afterZoomOut(coming);}},close:function(event){F.cancel();if(false===F.trigger('beforeClose')){return;}F.unbindEvents();if(!F.isActive){return;}if(!F.isOpen||event===true){$('.fancybox-wrap').stop(true).trigger('onReset').remove();F._afterZoomOut();}else{F.isOpen=F.isOpened=false;F.isClosing=true;$('.fancybox-item, .fancybox-nav').remove();F.wrap.stop(true,true).removeClass('fancybox-opened');F.transitions[F.current.closeMethod]();}},play:function(action){var clear=function(){clearTimeout(F.player.timer);},set=function(){clear();if(F.current&&F.player.isActive){F.player.timer=setTimeout(F.next,F.current.playSpeed);}},stop=function(){clear();D.unbind('.player');F.player.isActive=false;F.trigger('onPlayEnd');},start=function(){if(F.current&&(F.current.loop||F.current.index<F.group.length-1)){F.player.isActive=true;D.bind({'onCancel.player beforeClose.player':stop,'onUpdate.player':set,'beforeLoad.player':clear});set();F.trigger('onPlayStart');}};if(action===true||(!F.player.isActive&&action!==false)){start();}else{stop();}},next:function(direction){var current=F.current;if(current){if(!isString(direction)){direction=current.direction.next;}F.jumpto(current.index+1,direction,'next');}},prev:function(direction){var current=F.current;if(current){if(!isString(direction)){direction=current.direction.prev;}F.jumpto(current.index-1,direction,'prev');}},jumpto:function(index,direction,router){var current=F.current;if(!current){return;}index=getScalar(index);F.direction=direction||current.direction[(index>=current.index?'next':'prev')];F.router=router||'jumpto';if(current.loop){if(index<0){index=current.group.length+(index%current.group.length);}index=index%current.group.length;}if(current.group[index]!==undefined){F.cancel();F._start(index);}},reposition:function(e,onlyAbsolute){var current=F.current,wrap=current?current.wrap:null,pos;if(wrap){pos=F._getPosition(onlyAbsolute);if(e&&e.type==='scroll'){delete pos.position;wrap.stop(true,true).animate(pos,200);}else{wrap.css(pos);current.pos=$.extend({},current.dim,pos);}}},update:function(e){var type=(e&&e.type),anyway=!type||type==='orientationchange';if(anyway){clearTimeout(didUpdate);didUpdate=null;}if(!F.isOpen||didUpdate){return;}didUpdate=setTimeout(function(){var current=F.current;if(!current||F.isClosing){return;}F.wrap.removeClass('fancybox-tmp');if(anyway||type==='load'||(type==='resize'&&current.autoResize)){F._setDimension();}if(!(type==='scroll'&&current.canShrink)){F.reposition(e);}F.trigger('onUpdate');didUpdate=null;},(anyway&&!isTouch?0:300));},toggle:function(action){if(F.isOpen){F.current.fitToView=$.type(action)==="boolean"?action:!F.current.fitToView;if(isTouch){F.wrap.removeAttr('style').addClass('fancybox-tmp');F.trigger('onUpdate');}F.update();}},hideLoading:function(){D.unbind('.loading');$('#fancybox-loading').remove();},showLoading:function(){var el,viewport;F.hideLoading();el=$('<div id="fancybox-loading"><div></div></div>').click(F.cancel).appendTo('body');D.bind('keydown.loading',function(e){if((e.which||e.keyCode)===27){e.preventDefault();F.cancel();}});if(!F.defaults.fixed){viewport=F.getViewport();el.css({position:'absolute',top:(viewport.h*0.5)+viewport.y,left:(viewport.w*0.5)+viewport.x});}},getViewport:function(){var locked=(F.current&&F.current.locked)||false,rez={x:W.scrollLeft(),y:W.scrollTop()};if(locked){rez.w=locked[0].clientWidth;rez.h=locked[0].clientHeight;}else{rez.w=isTouch&&window.innerWidth?window.innerWidth:W.width();rez.h=isTouch&&window.innerHeight?window.innerHeight:W.height();}return rez;},unbindEvents:function(){if(F.wrap&&isQuery(F.wrap)){F.wrap.unbind('.fb');}D.unbind('.fb');W.unbind('.fb');},bindEvents:function(){var current=F.current,keys;if(!current){return;}W.bind('orientationchange.fb'+(isTouch?'':' resize.fb')+(current.autoCenter&&!current.locked?' scroll.fb':''),F.update);keys=current.keys;if(keys){D.bind('keydown.fb',function(e){var code=e.which||e.keyCode,target=e.target||e.srcElement;if(code===27&&F.coming){return false;}if(!e.ctrlKey&&!e.altKey&&!e.shiftKey&&!e.metaKey&&!(target&&(target.type||$(target).is('[contenteditable]')))){$.each(keys,function(i,val){if(current.group.length>1&&val[code]!==undefined){F[i](val[code]);e.preventDefault();return false;}if($.inArray(code,val)>-1){F[i]();e.preventDefault();return false;}});}});}if($.fn.mousewheel&&current.mouseWheel){F.wrap.bind('mousewheel.fb',function(e,delta,deltaX,deltaY){var target=e.target||null,parent=$(target),canScroll=false;while(parent.length){if(canScroll||parent.is('.fancybox-skin')||parent.is('.fancybox-wrap')){break;}canScroll=isScrollable(parent[0]);parent=$(parent).parent();}if(delta!==0&&!canScroll){if(F.group.length>1&&!current.canShrink){if(deltaY>0||deltaX>0){F.prev(deltaY>0?'down':'left');}else if(deltaY<0||deltaX<0){F.next(deltaY<0?'up':'right');}e.preventDefault();}}});}},trigger:function(event,o){var ret,obj=o||F.coming||F.current;if(!obj){return;}if($.isFunction(obj[event])){ret=obj[event].apply(obj,Array.prototype.slice.call(arguments,1));}if(ret===false){return false;}if(obj.helpers){$.each(obj.helpers,function(helper,opts){if(opts&&F.helpers[helper]&&$.isFunction(F.helpers[helper][event])){F.helpers[helper][event]($.extend(true,{},F.helpers[helper].defaults,opts),obj);}});}D.trigger(event);},isImage:function(str){return isString(str)&&str.match(/(^data:image\/.*,)|(\.(jp(e|g|eg)|gif|png|bmp|webp|svg)((\?|#).*)?$)/i);},isSWF:function(str){return isString(str)&&str.match(/\.(swf)((\?|#).*)?$/i);},_start:function(index){var coming={},obj,href,type,margin,padding;index=getScalar(index);obj=F.group[index]||null;if(!obj){return false;}coming=$.extend(true,{},F.opts,obj);margin=coming.margin;padding=coming.padding;if($.type(margin)==='number'){coming.margin=[margin,margin,margin,margin];}if($.type(padding)==='number'){coming.padding=[padding,padding,padding,padding];}if(coming.modal){$.extend(true,coming,{closeBtn:false,closeClick:false,nextClick:false,arrows:false,mouseWheel:false,keys:null,helpers:{overlay:{closeClick:false}}});}if(coming.autoSize){coming.autoWidth=coming.autoHeight=true;}if(coming.width==='auto'){coming.autoWidth=true;}if(coming.height==='auto'){coming.autoHeight=true;}coming.group=F.group;coming.index=index;F.coming=coming;if(false===F.trigger('beforeLoad')){F.coming=null;return;}type=coming.type;href=coming.href;if(!type){F.coming=null;if(F.current&&F.router&&F.router!=='jumpto'){F.current.index=index;return F[F.router](F.direction);}return false;}F.isActive=true;if(type==='image'||type==='swf'){coming.autoHeight=coming.autoWidth=false;coming.scrolling='visible';}if(type==='image'){coming.aspectRatio=true;}if(type==='iframe'&&isTouch){coming.scrolling='scroll';}coming.wrap=$(coming.tpl.wrap).addClass('fancybox-'+(isTouch?'mobile':'desktop')+' fancybox-type-'+type+' fancybox-tmp '+coming.wrapCSS).appendTo(coming.parent||'body');$.extend(coming,{skin:$('.fancybox-skin',coming.wrap),outer:$('.fancybox-outer',coming.wrap),inner:$('.fancybox-inner',coming.wrap)});$.each(["Top","Right","Bottom","Left"],function(i,v){coming.skin.css('padding'+v,getValue(coming.padding[i]));});F.trigger('onReady');if(type==='inline'||type==='html'){if(!coming.content||!coming.content.length){return F._error('content');}}else if(!href){return F._error('href');}if(type==='image'){F._loadImage();}else if(type==='ajax'){F._loadAjax();}else if(type==='iframe'){F._loadIframe();}else{F._afterLoad();}},_error:function(type){$.extend(F.coming,{type:'html',autoWidth:true,autoHeight:true,minWidth:0,minHeight:0,scrolling:'no',hasError:type,content:F.coming.tpl.error});F._afterLoad();},_loadImage:function(){var img=F.imgPreload=new Image();img.onload=function(){this.onload=this.onerror=null;F.coming.width=this.width/F.opts.pixelRatio;F.coming.height=this.height/F.opts.pixelRatio;F._afterLoad();};img.onerror=function(){this.onload=this.onerror=null;F._error('image');};img.src=F.coming.href;if(img.complete!==true){F.showLoading();}},_loadAjax:function(){var coming=F.coming;F.showLoading();F.ajaxLoad=$.ajax($.extend({},coming.ajax,{url:coming.href,error:function(jqXHR,textStatus){if(F.coming&&textStatus!=='abort'){F._error('ajax',jqXHR);}else{F.hideLoading();}},success:function(data,textStatus){if(textStatus==='success'){coming.content=data;F._afterLoad();}}}));},_loadIframe:function(){var coming=F.coming,iframe=$(coming.tpl.iframe.replace(/\{rnd\}/g,new Date().getTime())).attr('scrolling',isTouch?'auto':coming.iframe.scrolling).attr('src',coming.href);$(coming.wrap).bind('onReset',function(){try{$(this).find('iframe').hide().attr('src','//about:blank').end().empty();}catch(e){}});if(coming.iframe.preload){F.showLoading();iframe.one('load',function(){$(this).data('ready',1);if(!isTouch){$(this).bind('load.fb',F.update);}$(this).parents('.fancybox-wrap').width('100%').removeClass('fancybox-tmp').show();F._afterLoad();});}coming.content=iframe.appendTo(coming.inner);if(!coming.iframe.preload){F._afterLoad();}},_preloadImages:function(){var group=F.group,current=F.current,len=group.length,cnt=current.preload?Math.min(current.preload,len-1):0,item,i;for(i=1;i<=cnt;i+=1){item=group[(current.index+i)%len];if(item.type==='image'&&item.href){new Image().src=item.href;}}},_afterLoad:function(){var coming=F.coming,previous=F.current,placeholder='fancybox-placeholder',current,content,type,scrolling,href,embed;F.hideLoading();if(!coming||F.isActive===false){return;}if(false===F.trigger('afterLoad',coming,previous)){coming.wrap.stop(true).trigger('onReset').remove();F.coming=null;return;}if(previous){F.trigger('beforeChange',previous);previous.wrap.stop(true).removeClass('fancybox-opened').find('.fancybox-item, .fancybox-nav').remove();}F.unbindEvents();current=coming;content=coming.content;type=coming.type;scrolling=coming.scrolling;$.extend(F,{wrap:current.wrap,skin:current.skin,outer:current.outer,inner:current.inner,current:current,previous:previous});href=current.href;switch(type){case'inline':case'ajax':case'html':if(current.selector){content=$('<div>').html(content).find(current.selector);}else if(isQuery(content)){if(!content.data(placeholder)){content.data(placeholder,$('<div class="'+placeholder+'"></div>').insertAfter(content).hide());}content=content.show().detach();current.wrap.bind('onReset',function(){if($(this).find(content).length){content.hide().replaceAll(content.data(placeholder)).data(placeholder,false);}});}break;case'image':content=current.tpl.image.replace('{href}',href);break;case'swf':content='<object id="fancybox-swf" classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" width="100%" height="100%"><param name="movie" value="'+href+'"></param>';embed='';$.each(current.swf,function(name,val){content+='<param name="'+name+'" value="'+val+'"></param>';embed+=' '+name+'="'+val+'"';});content+='<embed src="'+href+'" type="application/x-shockwave-flash" width="100%" height="100%"'+embed+'></embed></object>';break;}if(!(isQuery(content)&&content.parent().is(current.inner))){current.inner.append(content);}F.trigger('beforeShow');current.inner.css('overflow',scrolling==='yes'?'scroll':(scrolling==='no'?'hidden':scrolling));F._setDimension();F.reposition();F.isOpen=false;F.coming=null;F.bindEvents();if(!F.isOpened){$('.fancybox-wrap').not(current.wrap).stop(true).trigger('onReset').remove();}else if(previous.prevMethod){F.transitions[previous.prevMethod]();}F.transitions[F.isOpened?current.nextMethod:current.openMethod]();F._preloadImages();},_setDimension:function(){var viewport=F.getViewport(),steps=0,canShrink=false,canExpand=false,wrap=F.wrap,skin=F.skin,inner=F.inner,current=F.current,width=current.width,height=current.height,minWidth=current.minWidth,minHeight=current.minHeight,maxWidth=current.maxWidth,maxHeight=current.maxHeight,scrolling=current.scrolling,scrollOut=current.scrollOutside?current.scrollbarWidth:0,margin=current.margin,wMargin=getScalar(margin[1]+margin[3]),hMargin=getScalar(margin[0]+margin[2]),wPadding,hPadding,wSpace,hSpace,origWidth,origHeight,origMaxWidth,origMaxHeight,ratio,width_,height_,maxWidth_,maxHeight_,iframe,body;wrap.add(skin).add(inner).width('auto').height('auto').removeClass('fancybox-tmp');wPadding=getScalar(skin.outerWidth(true)-skin.width());hPadding=getScalar(skin.outerHeight(true)-skin.height());wSpace=wMargin+wPadding;hSpace=hMargin+hPadding;origWidth=isPercentage(width)?(viewport.w-wSpace)*getScalar(width)/100:width;origHeight=isPercentage(height)?(viewport.h-hSpace)*getScalar(height)/100:height;if(current.type==='iframe'){iframe=current.content;if(current.autoHeight&&iframe.data('ready')===1){try{if(iframe[0].contentWindow.document.location){inner.width(origWidth).height(9999);body=iframe.contents().find('body');if(scrollOut){body.css('overflow-x','hidden');}origHeight=body.outerHeight(true);}}catch(e){}}}else if(current.autoWidth||current.autoHeight){inner.addClass('fancybox-tmp');if(!current.autoWidth){inner.width(origWidth);}if(!current.autoHeight){inner.height(origHeight);}if(current.autoWidth){origWidth=inner.width();}if(current.autoHeight){origHeight=inner.height();}inner.removeClass('fancybox-tmp');}width=getScalar(origWidth);height=getScalar(origHeight);ratio=origWidth/origHeight;minWidth=getScalar(isPercentage(minWidth)?getScalar(minWidth,'w')-wSpace:minWidth);maxWidth=getScalar(isPercentage(maxWidth)?getScalar(maxWidth,'w')-wSpace:maxWidth);minHeight=getScalar(isPercentage(minHeight)?getScalar(minHeight,'h')-hSpace:minHeight);maxHeight=getScalar(isPercentage(maxHeight)?getScalar(maxHeight,'h')-hSpace:maxHeight);origMaxWidth=maxWidth;origMaxHeight=maxHeight;if(current.fitToView){maxWidth=Math.min(viewport.w-wSpace,maxWidth);maxHeight=Math.min(viewport.h-hSpace,maxHeight);}maxWidth_=viewport.w-wMargin;maxHeight_=viewport.h-hMargin;if(current.aspectRatio){if(width>maxWidth){width=maxWidth;height=getScalar(width/ratio);}if(height>maxHeight){height=maxHeight;width=getScalar(height*ratio);}if(width<minWidth){width=minWidth;height=getScalar(width/ratio);}if(height<minHeight){height=minHeight;width=getScalar(height*ratio);}}else{width=Math.max(minWidth,Math.min(width,maxWidth));if(current.autoHeight&&current.type!=='iframe'){inner.width(width);height=inner.height();}height=Math.max(minHeight,Math.min(height,maxHeight));}if(current.fitToView){inner.width(width).height(height);wrap.width(width+wPadding);width_=wrap.width();height_=wrap.height();if(current.aspectRatio){while((width_>maxWidth_||height_>maxHeight_)&&width>minWidth&&height>minHeight){if(steps++>19){break;}height=Math.max(minHeight,Math.min(maxHeight,height-10));width=getScalar(height*ratio);if(width<minWidth){width=minWidth;height=getScalar(width/ratio);}if(width>maxWidth){width=maxWidth;height=getScalar(width/ratio);}inner.width(width).height(height);wrap.width(width+wPadding);width_=wrap.width();height_=wrap.height();}}else{width=Math.max(minWidth,Math.min(width,width-(width_-maxWidth_)));height=Math.max(minHeight,Math.min(height,height-(height_-maxHeight_)));}}if(scrollOut&&scrolling==='auto'&&height<origHeight&&(width+wPadding+scrollOut)<maxWidth_){width+=scrollOut;}inner.width(width).height(height);wrap.width(width+wPadding);width_=wrap.width();height_=wrap.height();canShrink=(width_>maxWidth_||height_>maxHeight_)&&width>minWidth&&height>minHeight;canExpand=current.aspectRatio?(width<origMaxWidth&&height<origMaxHeight&&width<origWidth&&height<origHeight):((width<origMaxWidth||height<origMaxHeight)&&(width<origWidth||height<origHeight));$.extend(current,{dim:{width:getValue(width_),height:getValue(height_)},origWidth:origWidth,origHeight:origHeight,canShrink:canShrink,canExpand:canExpand,wPadding:wPadding,hPadding:hPadding,wrapSpace:height_-skin.outerHeight(true),skinSpace:skin.height()-height});if(!iframe&&current.autoHeight&&height>minHeight&&height<maxHeight&&!canExpand){inner.height('auto');}},_getPosition:function(onlyAbsolute){var current=F.current,viewport=F.getViewport(),margin=current.margin,width=F.wrap.width()+margin[1]+margin[3],height=F.wrap.height()+margin[0]+margin[2],rez={position:'absolute',top:margin[0],left:margin[3]};if(current.autoCenter&&current.fixed&&!onlyAbsolute&&height<=viewport.h&&width<=viewport.w){rez.position='fixed';}else if(!current.locked){rez.top+=viewport.y;rez.left+=viewport.x;}rez.top=getValue(Math.max(rez.top,rez.top+((viewport.h-height)*current.topRatio)));rez.left=getValue(Math.max(rez.left,rez.left+((viewport.w-width)*current.leftRatio)));return rez;},_afterZoomIn:function(){var current=F.current;if(!current){return;}F.isOpen=F.isOpened=true;F.wrap.css('overflow','visible').addClass('fancybox-opened');F.update();if(current.closeClick||(current.nextClick&&F.group.length>1)){F.inner.css('cursor','pointer').bind('click.fb',function(e){if(!$(e.target).is('a')&&!$(e.target).parent().is('a')){e.preventDefault();F[current.closeClick?'close':'next']();}});}if(current.closeBtn){$(current.tpl.closeBtn).appendTo(F.skin).bind('click.fb',function(e){e.preventDefault();F.close();});}if(current.arrows&&F.group.length>1){if(current.loop||current.index>0){$(current.tpl.prev).appendTo(F.outer).bind('click.fb',F.prev);}if(current.loop||current.index<F.group.length-1){$(current.tpl.next).appendTo(F.outer).bind('click.fb',F.next);}}F.trigger('afterShow');if(!current.loop&&current.index===current.group.length-1){F.play(false);}else if(F.opts.autoPlay&&!F.player.isActive){F.opts.autoPlay=false;F.play();}},_afterZoomOut:function(obj){obj=obj||F.current;$('.fancybox-wrap').trigger('onReset').remove();$.extend(F,{group:{},opts:{},router:false,current:null,isActive:false,isOpened:false,isOpen:false,isClosing:false,wrap:null,skin:null,outer:null,inner:null});F.trigger('afterClose',obj);}});F.transitions={getOrigPosition:function(){var current=F.current,element=current.element,orig=current.orig,pos={},width=50,height=50,hPadding=current.hPadding,wPadding=current.wPadding,viewport=F.getViewport();if(!orig&&current.isDom&&element.is(':visible')){orig=element.find('img:first');if(!orig.length){orig=element;}}if(isQuery(orig)){pos=orig.offset();if(orig.is('img')){width=orig.outerWidth();height=orig.outerHeight();}}else{pos.top=viewport.y+(viewport.h-height)*current.topRatio;pos.left=viewport.x+(viewport.w-width)*current.leftRatio;}if(F.wrap.css('position')==='fixed'||current.locked){pos.top-=viewport.y;pos.left-=viewport.x;}pos={top:getValue(pos.top-hPadding*current.topRatio),left:getValue(pos.left-wPadding*current.leftRatio),width:getValue(width+wPadding),height:getValue(height+hPadding)};return pos;},step:function(now,fx){var ratio,padding,value,prop=fx.prop,current=F.current,wrapSpace=current.wrapSpace,skinSpace=current.skinSpace;if(prop==='width'||prop==='height'){ratio=fx.end===fx.start?1:(now-fx.start)/(fx.end-fx.start);if(F.isClosing){ratio=1-ratio;}padding=prop==='width'?current.wPadding:current.hPadding;value=now-padding;F.skin[prop](getScalar(prop==='width'?value:value-(wrapSpace*ratio)));F.inner[prop](getScalar(prop==='width'?value:value-(wrapSpace*ratio)-(skinSpace*ratio)));}},zoomIn:function(){var current=F.current,startPos=current.pos,effect=current.openEffect,elastic=effect==='elastic',endPos=$.extend({opacity:1},startPos);delete endPos.position;if(elastic){startPos=this.getOrigPosition();if(current.openOpacity){startPos.opacity=0.1;}}else if(effect==='fade'){startPos.opacity=0.1;}F.wrap.css(startPos).animate(endPos,{duration:effect==='none'?0:current.openSpeed,easing:current.openEasing,step:elastic?this.step:null,complete:F._afterZoomIn});},zoomOut:function(){var current=F.current,effect=current.closeEffect,elastic=effect==='elastic',endPos={opacity:0.1};if(elastic){endPos=this.getOrigPosition();if(current.closeOpacity){endPos.opacity=0.1;}}F.wrap.animate(endPos,{duration:effect==='none'?0:current.closeSpeed,easing:current.closeEasing,step:elastic?this.step:null,complete:F._afterZoomOut});},changeIn:function(){var current=F.current,effect=current.nextEffect,startPos=current.pos,endPos={opacity:1},direction=F.direction,distance=200,field;startPos.opacity=0.1;if(effect==='elastic'){field=direction==='down'||direction==='up'?'top':'left';if(direction==='down'||direction==='right'){startPos[field]=getValue(getScalar(startPos[field])-distance);endPos[field]='+='+distance+'px';}else{startPos[field]=getValue(getScalar(startPos[field])+distance);endPos[field]='-='+distance+'px';}}if(effect==='none'){F._afterZoomIn();}else{F.wrap.css(startPos).animate(endPos,{duration:current.nextSpeed,easing:current.nextEasing,complete:F._afterZoomIn});}},changeOut:function(){var previous=F.previous,effect=previous.prevEffect,endPos={opacity:0.1},direction=F.direction,distance=200;if(effect==='elastic'){endPos[direction==='down'||direction==='up'?'top':'left']=(direction==='up'||direction==='left'?'-':'+')+'='+distance+'px';}previous.wrap.animate(endPos,{duration:effect==='none'?0:previous.prevSpeed,easing:previous.prevEasing,complete:function(){$(this).trigger('onReset').remove();}});}};F.helpers.overlay={defaults:{closeClick:true,speedOut:200,showEarly:true,css:{},locked:!isTouch,fixed:true},overlay:null,fixed:false,el:$('html'),create:function(opts){opts=$.extend({},this.defaults,opts);if(this.overlay){this.close();}this.overlay=$('<div class="fancybox-overlay"></div>').appendTo(F.coming?F.coming.parent:opts.parent);this.fixed=false;if(opts.fixed&&F.defaults.fixed){this.overlay.addClass('fancybox-overlay-fixed');this.fixed=true;}},open:function(opts){var that=this;opts=$.extend({},this.defaults,opts);if(this.overlay){this.overlay.unbind('.overlay').width('auto').height('auto');}else{this.create(opts);}if(!this.fixed){W.bind('resize.overlay',$.proxy(this.update,this));this.update();}if(opts.closeClick){this.overlay.bind('click.overlay',function(e){if($(e.target).hasClass('fancybox-overlay')){if(F.isActive){F.close();}else{that.close();}return false;}});}this.overlay.css(opts.css).show();},close:function(){var scrollV,scrollH;W.unbind('resize.overlay');if(this.el.hasClass('fancybox-lock')){$('.fancybox-margin').removeClass('fancybox-margin');scrollV=W.scrollTop();scrollH=W.scrollLeft();this.el.removeClass('fancybox-lock');W.scrollTop(scrollV).scrollLeft(scrollH);}$('.fancybox-overlay').remove().hide();$.extend(this,{overlay:null,fixed:false});},update:function(){var width='100%',offsetWidth;this.overlay.width(width).height('100%');if(IE){offsetWidth=Math.max(document.documentElement.offsetWidth,document.body.offsetWidth);if(D.width()>offsetWidth){width=D.width();}}else if(D.width()>W.width()){width=D.width();}this.overlay.width(width).height(D.height());},onReady:function(opts,obj){var overlay=this.overlay;$('.fancybox-overlay').stop(true,true);if(!overlay){this.create(opts);}if(opts.locked&&this.fixed&&obj.fixed){if(!overlay){this.margin=D.height()>W.height()?$('html').css('margin-right').replace("px",""):false;}obj.locked=this.overlay.append(obj.wrap);obj.fixed=false;}if(opts.showEarly===true){this.beforeShow.apply(this,arguments);}},beforeShow:function(opts,obj){var scrollV,scrollH;if(obj.locked){if(this.margin!==false){$('*').filter(function(){return($(this).css('position')==='fixed'&&!$(this).hasClass("fancybox-overlay")&&!$(this).hasClass("fancybox-wrap"));}).addClass('fancybox-margin');this.el.addClass('fancybox-margin');}scrollV=W.scrollTop();scrollH=W.scrollLeft();this.el.addClass('fancybox-lock');W.scrollTop(scrollV).scrollLeft(scrollH);}this.open(opts);},onUpdate:function(){if(!this.fixed){this.update();}},afterClose:function(opts){if(this.overlay&&!F.coming){this.overlay.fadeOut(opts.speedOut,$.proxy(this.close,this));}}};F.helpers.title={defaults:{type:'float',position:'bottom'},beforeShow:function(opts){var current=F.current,text=current.title,type=opts.type,title,target;if($.isFunction(text)){text=text.call(current.element,current);}if(!isString(text)||$.trim(text)===''){return;}title=$('<div class="fancybox-title fancybox-title-'+type+'-wrap">'+text+'</div>');switch(type){case'inside':target=F.skin;break;case'outside':target=F.wrap;break;case'over':target=F.inner;break;default:target=F.skin;title.appendTo('body');if(IE){title.width(title.width());}title.wrapInner('<span class="child"></span>');F.current.margin[2]+=Math.abs(getScalar(title.css('margin-bottom')));break;}title[(opts.position==='top'?'prependTo':'appendTo')](target);}};$.fn.fancybox=function(options){var index,that=$(this),selector=this.selector||'',run=function(e){var what=$(this).blur(),idx=index,relType,relVal;if(!(e.ctrlKey||e.altKey||e.shiftKey||e.metaKey)&&!what.is('.fancybox-wrap')){relType=options.groupAttr||'data-fancybox-group';relVal=what.attr(relType);if(!relVal){relType='rel';relVal=what.get(0)[relType];}if(relVal&&relVal!==''&&relVal!=='nofollow'){what=selector.length?$(selector):that;what=what.filter('['+relType+'="'+relVal+'"]');idx=what.index(this);}options.index=idx;if(F.open(what,options)!==false){e.preventDefault();}}};options=options||{};index=options.index||0;if(!selector||options.live===false){that.unbind('click.fb-start').bind('click.fb-start',run);}else{D.undelegate(selector,'click.fb-start').delegate(selector+":not('.fancybox-item, .fancybox-nav')",'click.fb-start',run);}this.filter('[data-fancybox-start=1]').trigger('click');return this;};D.ready(function(){var w1,w2;if($.scrollbarWidth===undefined){$.scrollbarWidth=function(){var parent=$('<div style="width:50px;height:50px;overflow:auto"><div/></div>').appendTo('body'),child=parent.children(),width=child.innerWidth()-child.height(99).innerWidth();parent.remove();return width;};}if($.support.fixedPosition===undefined){$.support.fixedPosition=(function(){var elem=$('<div style="position:fixed;top:20px;"></div>').appendTo('body'),fixed=(elem[0].offsetTop===20||elem[0].offsetTop===15);elem.remove();return false;}());}$.extend(F.defaults,{scrollbarWidth:$.scrollbarWidth(),fixed:$.support.fixedPosition,parent:$('body')});w1=$(window).width();H.addClass('fancybox-lock-test');w2=$(window).width();H.removeClass('fancybox-lock-test');$("<style type='text/css'>.fancybox-margin{margin-right:"+(w2-w1)+"px;}</style>").appendTo("head");});}(window,document,jQuery));






(function($){"use strict";var F=$.fancybox,format=function(url,rez,params){params=params||'';if($.type(params)==="object"){params=$.param(params,true);}$.each(rez,function(key,value){url=url.replace('$'+key,value||'');});if(params.length){url+=(url.indexOf('?')>0?'&':'?')+params;}return url;};F.helpers.media={defaults:{youtube:{matcher:/(youtube\.com|youtu\.be|youtube-nocookie\.com)\/(watch\?v=|v\/|u\/|embed\/?)?(videoseries\?list=(.*)|[\w-]{11}|\?listType=(.*)&list=(.*)).*/i,params:{autoplay:1,autohide:1,fs:1,rel:0,hd:1,wmode:'opaque',enablejsapi:1},type:'iframe',url:'//www.youtube.com/embed/$3'},vimeo:{matcher:/(?:vimeo(?:pro)?.com)\/(?:[^\d]+)?(\d+)(?:.*)/,params:{autoplay:1,hd:1,show_title:1,show_byline:1,show_portrait:0,fullscreen:1},type:'iframe',url:'//player.vimeo.com/video/$1'},metacafe:{matcher:/metacafe.com\/(?:watch|fplayer)\/([\w\-]{1,10})/,params:{autoPlay:'yes'},type:'swf',url:function(rez,params,obj){obj.swf.flashVars='playerVars='+$.param(params,true);return'//www.metacafe.com/fplayer/'+rez[1]+'/.swf';}},dailymotion:{matcher:/dailymotion.com\/video\/(.*)\/?(.*)/,params:{additionalInfos:0,autoStart:1},type:'swf',url:'//www.dailymotion.com/swf/video/$1'},twitvid:{matcher:/twitvid\.com\/([a-zA-Z0-9_\-\?\=]+)/i,params:{autoplay:0},type:'iframe',url:'//www.twitvid.com/embed.php?guid=$1'},twitpic:{matcher:/twitpic\.com\/(?!(?:place|photos|events)\/)([a-zA-Z0-9\?\=\-]+)/i,type:'image',url:'//twitpic.com/show/full/$1/'},instagram:{matcher:/(instagr\.am|instagram\.com)\/p\/([a-zA-Z0-9_\-]+)\/?/i,type:'image',url:'//$1/p/$2/media/?size=l'},google_maps:{matcher:/maps\.google\.([a-z]{2,3}(\.[a-z]{2})?)\/(\?ll=|maps\?)(.*)/i,type:'iframe',url:function(rez){return'//maps.google.'+rez[1]+'/'+rez[3]+''+rez[4]+'&output='+(rez[4].indexOf('layer=c')>0?'svembed':'embed');}}},beforeLoad:function(opts,obj){var url=obj.href||'',type=false,what,item,rez,params;for(what in opts){if(opts.hasOwnProperty(what)){item=opts[what];rez=url.match(item.matcher);if(rez){type=item.type;params=$.extend(true,{},item.params,obj[what]||($.isPlainObject(opts[what])?opts[what].params:null));url=$.type(item.url)==="function"?item.url.call(this,rez,params,obj):format(item.url,rez,params);break;}}}if(type){obj.href=url;obj.type=type;obj.autoHeight=false;}}};}(jQuery));




/*
 * Metadata - jQuery plugin for parsing metadata from elements
 *
 * Copyright (c) 2006 John Resig, Yehuda Katz, Jцrn Zaefferer, Paul McLanahan
 *
	* Licensed under http://en.wikipedia.org/wiki/MIT_License
 *
 *
 */

/**
 * Sets the type of metadata to use. Metadata is encoded in JSON, and each property
 * in the JSON will become a property of the element itself.
 *
 * There are three supported types of metadata storage:
 *
 *   attr:  Inside an attribute. The name parameter indicates *which* attribute.
 *          
 *   class: Inside the class attribute, wrapped in curly braces: { }
 *   
 *   elem:  Inside a child element (e.g. a script tag). The
 *          name parameter indicates *which* element.
 *          
 * The metadata for an element is loaded the first time the element is accessed via jQuery.
 *
 * As a result, you can define the metadata type, use $(expr) to load the metadata into the elements
 * matched by expr, then redefine the metadata type and run another $(expr) for other elements.
 * 
 * @name $.metadata.setType
 *
 * @example <p id="one" class="some_class {item_id: 1, item_label: 'Label'}">This is a p</p>
 * @before $.metadata.setType("class")
 * @after $("#one").metadata().item_id == 1; $("#one").metadata().item_label == "Label"
 * @desc Reads metadata from the class attribute
 * 
 * @example <p id="one" class="some_class" data="{item_id: 1, item_label: 'Label'}">This is a p</p>
 * @before $.metadata.setType("attr", "data")
 * @after $("#one").metadata().item_id == 1; $("#one").metadata().item_label == "Label"
 * @desc Reads metadata from a "data" attribute
 * 
 * @example <p id="one" class="some_class"><script>{item_id: 1, item_label: 'Label'}</script>This is a p</p>
 * @before $.metadata.setType("elem", "script")
 * @after $("#one").metadata().item_id == 1; $("#one").metadata().item_label == "Label"
 * @desc Reads metadata from a nested script element
 * 
 * @param String type The encoding type
 * @param String name The name of the attribute to be used to get metadata (optional)
 * @cat Plugins/Metadata
 * @descr Sets the type of encoding to be used when loading metadata for the first time
 * @type undefined
 * @see metadata()
 */

(function($) {

$.extend({
	metadata : {
		defaults : {
			type: 'class',
			name: 'metadata',
			cre: /({.*})/,
			single: 'metadata'
		},
		setType: function( type, name ){
			this.defaults.type = type;
			this.defaults.name = name;
		},
		get: function( elem, opts ){
			var settings = $.extend({},this.defaults,opts);
			// check for empty string in single property
			if ( !settings.single.length ) settings.single = 'metadata';
			
			var data = $.data(elem, settings.single);
			// returned cached data if it already exists
			if ( data ) return data;
			
			data = "{}";
			
			if ( settings.type == "class" ) {
				var m = settings.cre.exec( elem.className );
				if ( m )
					data = m[1];
			} else if ( settings.type == "elem" ) {
				if( !elem.getElementsByTagName ) return;
				var e = elem.getElementsByTagName(settings.name);
				if ( e.length )
					data = $.trim(e[0].innerHTML);
			} else if ( elem.getAttribute != undefined ) {
				var attr = elem.getAttribute( settings.name );
				if ( attr )
					data = attr;
			}
			
			if ( data.indexOf( '{' ) <0 )
			data = "{" + data + "}";
			
			data = eval("(" + data + ")");
			
			$.data( elem, settings.single, data );
			return data;
		}
	}
});

/**
 * Returns the metadata object for the first member of the jQuery object.
 *
 * @name metadata
 * @descr Returns element's metadata object
 * @param Object opts An object contianing settings to override the defaults
 * @type jQuery
 * @cat Plugins/Metadata
 */
$.fn.metadata = function( opts ){
	return $.metadata.get( this[0], opts );
};

})(jQuery);



/*
 ### jQuery Star Rating Plugin v4.11 - 2013-03-14 ###
 * Home: http://www.fyneworks.com/jquery/star-rating/
 * Code: http://code.google.com/p/jquery-star-rating-plugin/
 *
	* Licensed under http://en.wikipedia.org/wiki/MIT_License
 ###
*/

/*# AVOID COLLISIONS #*/
;if(window.jQuery) (function($){
/*# AVOID COLLISIONS #*/
	
	// IE6 Background Image Fix
	if ((!$.support.opacity && !$.support.style)) try { document.execCommand("BackgroundImageCache", false, true)} catch(e) { };
	// Thanks to http://www.visualjquery.com/rating/rating_redux.html
	
	// plugin initialization
	$.fn.rating = function(options){
		if(this.length==0) return this; // quick fail
		
		// Handle API methods
		if(typeof arguments[0]=='string'){
			// Perform API methods on individual elements
			if(this.length>1){
				var args = arguments;
				return this.each(function(){
					$.fn.rating.apply($(this), args);
    });
			};
			// Invoke API method handler
			$.fn.rating[arguments[0]].apply(this, $.makeArray(arguments).slice(1) || []);
			// Quick exit...
			return this;
		};
		
		// Initialize options for this call
		var options = $.extend(
			{}/* new object */,
			$.fn.rating.options/* default options */,
			options || {} /* just-in-time options */
		);
		
		// Allow multiple controls with the same name by making each call unique
		$.fn.rating.calls++;
		
		// loop through each matched element
		this
		 .not('.star-rating-applied')
			.addClass('star-rating-applied')
		.each(function(){
			
			// Load control parameters / find context / etc
			var control, input = $(this);
			var eid = (this.name || 'unnamed-rating').replace(/\[|\]/g, '_').replace(/^\_+|\_+$/g,'');
			var context = $(this.form || document.body);
			
			// FIX: http://code.google.com/p/jquery-star-rating-plugin/issues/detail?id=23
			var raters = context.data('rating');
			if(!raters || raters.call!=$.fn.rating.calls) raters = { count:0, call:$.fn.rating.calls };
			var rater = raters[eid] || context.data('rating'+eid);
			
			// if rater is available, verify that the control still exists
			if(rater) control = rater.data('rating');
			
			if(rater && control)//{// save a byte!
				// add star to control if rater is available and the same control still exists
				control.count++;
				
			//}// save a byte!
			else{
				// create new control if first star or control element was removed/replaced
				
				// Initialize options for this rater
				control = $.extend(
					{}/* new object */,
					options || {} /* current call options */,
					($.metadata? input.metadata(): ($.meta?input.data():null)) || {}, /* metadata options */
					{ count:0, stars: [], inputs: [] }
				);
				
				// increment number of rating controls
				control.serial = raters.count++;
				
				// create rating element
				rater = $('<span class="star-rating-control"/>');
				input.before(rater);
				
				// Mark element for initialization (once all stars are ready)
				rater.addClass('rating-to-be-drawn');
				
				// Accept readOnly setting from 'disabled' property
				if(input.attr('disabled') || input.hasClass('disabled')) control.readOnly = true;
				
				// Accept required setting from class property (class='required')
				if(input.hasClass('required')) control.required = true;
				
				// Create 'cancel' button
				rater.append(
					control.cancel = $('<div class="rating-cancel"><a title="' + control.cancel + '">' + control.cancelValue + '</a></div>')
					.on('mouseover',function(){
						$(this).rating('drain');
						$(this).addClass('star-rating-hover');
						//$(this).rating('focus');
					})
					.on('mouseout',function(){
						$(this).rating('draw');
						$(this).removeClass('star-rating-hover');
						//$(this).rating('blur');
					})
					.on('click',function(){
					 $(this).rating('select');
					})
					.data('rating', control)
				);
				
			}; // first element of group
			
			// insert rating star (thanks Jan Fanslau rev125 for blind support https://code.google.com/p/jquery-star-rating-plugin/issues/detail?id=125)
			var star = $('<div role="text" aria-label="'+ this.title +'" class="star-rating rater-'+ control.serial +'"><a title="' + (this.title || this.value) + '">' + this.value + '</a></div>');
			rater.append(star);
			
			// inherit attributes from input element
			if(this.id) star.attr('id', this.id);
			if(this.className) star.addClass(this.className);
			
			// Half-stars?
			if(control.half) control.split = 2;
			
			// Prepare division control
			if(typeof control.split=='number' && control.split>0){
				var stw = ($.fn.width ? star.width() : 0) || control.starWidth;
				var spi = (control.count % control.split), spw = Math.floor(stw/control.split);
				star
				// restrict star's width and hide overflow (already in CSS)
				.width(spw)
				// move the star left by using a negative margin
				// this is work-around to IE's stupid box model (position:relative doesn't work)
				.find('a').css({ 'margin-left':'-'+ (spi*spw) +'px' })
			};
			
			// readOnly?
			if(control.readOnly)//{ //save a byte!
				// Mark star as readOnly so user can customize display
				star.addClass('star-rating-readonly');
			//}  //save a byte!
			else//{ //save a byte!
			 // Enable hover css effects
				star.addClass('star-rating-live')
				 // Attach mouse events
					.on('mouseover',function(){
						$(this).rating('fill');
						$(this).rating('focus');
					})
					.on('mouseout',function(){
						$(this).rating('draw');
						$(this).rating('blur');
					})
					.on('click',function(){
						$(this).rating('select');
					})
				;
			//}; //save a byte!
			
			// set current selection
			if(this.checked)	control.current = star;
			
			// set current select for links
			if(this.nodeName=="A"){
    if($(this).hasClass('selected'))
     control.current = star;
   };
			
			// hide input element
			input.hide();
			
			// backward compatibility, form element to plugin
			input.on('change.rating',function(event){
				if(event.selfTriggered) return false;
    $(this).rating('select');
   });
			
			// attach reference to star to input element and vice-versa
			star.data('rating.input', input.data('rating.star', star));
			
			// store control information in form (or body when form not available)
			control.stars[control.stars.length] = star[0];
			control.inputs[control.inputs.length] = input[0];
			control.rater = raters[eid] = rater;
			control.context = context;
			
			input.data('rating', control);
			rater.data('rating', control);
			star.data('rating', control);
			context.data('rating', raters);
			context.data('rating'+eid, rater); // required for ajax forms
  }); // each element
		
		// Initialize ratings (first draw)
		$('.rating-to-be-drawn').rating('draw').removeClass('rating-to-be-drawn');
		
		return this; // don't break the chain...
	};
	
	/*--------------------------------------------------------*/
	
	/*
		### Core functionality and API ###
	*/
	$.extend($.fn.rating, {
		// Used to append a unique serial number to internal control ID
		// each time the plugin is invoked so same name controls can co-exist
		calls: 0,
		
		focus: function(){
			var control = this.data('rating'); if(!control) return this;
			if(!control.focus) return this; // quick fail if not required
			// find data for event
			var input = $(this).data('rating.input') || $( this.tagName=='INPUT' ? this : null );
   // focus handler, as requested by focusdigital.co.uk
			if(control.focus) control.focus.apply(input[0], [input.val(), $('a', input.data('rating.star'))[0]]);
		}, // $.fn.rating.focus
		
		blur: function(){
			var control = this.data('rating'); if(!control) return this;
			if(!control.blur) return this; // quick fail if not required
			// find data for event
			var input = $(this).data('rating.input') || $( this.tagName=='INPUT' ? this : null );
   // blur handler, as requested by focusdigital.co.uk
			if(control.blur) control.blur.apply(input[0], [input.val(), $('a', input.data('rating.star'))[0]]);
		}, // $.fn.rating.blur
		
		fill: function(){ // fill to the current mouse position.
			var control = this.data('rating'); if(!control) return this;
			// do not execute when control is in read-only mode
			if(control.readOnly) return;
			// Reset all stars and highlight them up to this element
			this.rating('drain');
			this.prevAll().addBack().filter('.rater-'+ control.serial).addClass('star-rating-hover');
		},// $.fn.rating.fill
		
		drain: function() { // drain all the stars.
			var control = this.data('rating'); if(!control) return this;
			// do not execute when control is in read-only mode
			if(control.readOnly) return;
			// Reset all stars
			control.rater.children().filter('.rater-'+ control.serial).removeClass('star-rating-on').removeClass('star-rating-hover');
		},// $.fn.rating.drain
		
		draw: function(){ // set value and stars to reflect current selection
			var control = this.data('rating'); if(!control) return this;
			// Clear all stars
			this.rating('drain');
			// Set control value
			var current = $( control.current );//? control.current.data('rating.input') : null );
			var starson = current.length ? current.prevAll().addBack().filter('.rater-'+ control.serial) : null;
			if(starson)	starson.addClass('star-rating-on');
			// Show/hide 'cancel' button
			control.cancel[control.readOnly || control.required?'hide':'show']();
			// Add/remove read-only classes to remove hand pointer
			this.siblings()[control.readOnly?'addClass':'removeClass']('star-rating-readonly');
		},// $.fn.rating.draw
		
		
		
		
		
		select: function(value,wantCallBack){ // select a value
			var control = this.data('rating'); if(!control) return this;
			// do not execute when control is in read-only mode
			if(control.readOnly) return;
			// clear selection
			control.current = null;
			// programmatically (based on user input)
			if(typeof value!='undefined' || this.length>1){
			 // select by index (0 based)
				if(typeof value=='number')
 			 return $(control.stars[value]).rating('select',undefined,wantCallBack);
				// select by literal value (must be passed as a string
				if(typeof value=='string'){
					//return
					$.each(control.stars, function(){
 					//console.log($(this).data('rating.input'), $(this).data('rating.input').val(), value, $(this).data('rating.input').val()==value?'BINGO!':'');
						if($(this).data('rating.input').val()==value) $(this).rating('select',undefined,wantCallBack);
					});
					// don't break the chain
  			return this;
				};
			}
			else{
				control.current = this[0].tagName=='INPUT' ?
				 this.data('rating.star') :
					(this.is('.rater-'+ control.serial) ? this : null);
			};
			// Update rating control state
			this.data('rating', control);
			// Update display
			this.rating('draw');
			// find current input and its sibblings
			var current = $( control.current ? control.current.data('rating.input') : null );
			var lastipt = $( control.inputs ).filter(':checked');
			var deadipt = $( control.inputs ).not(current);
			// check and uncheck elements as required
			deadipt.prop('checked',false);//.removeAttr('checked');
			current.prop('checked',true);//.attr('checked','checked');
			// trigger change on current or last selected input
			$(current.length? current : lastipt ).trigger({ type:'change', selfTriggered:true });
			// click callback, as requested here: http://plugins.jquery.com/node/1655
			if((wantCallBack || wantCallBack == undefined) && control.callback) control.callback.apply(current[0], [current.val(), $('a', control.current)[0]]);// callback event
			// don't break the chain
			return this;
  },// $.fn.rating.select
		
		
		
		
		
		readOnly: function(toggle, disable){ // make the control read-only (still submits value)
			var control = this.data('rating'); if(!control) return this;
			// setread-only status
			control.readOnly = toggle || toggle==undefined ? true : false;
			// enable/disable control value submission
			if(disable) $(control.inputs).attr("disabled", "disabled");
			else     			$(control.inputs).removeAttr("disabled");
			// Update rating control state
			this.data('rating', control);
			// Update display
			this.rating('draw');
		},// $.fn.rating.readOnly
		
		disable: function(){ // make read-only and never submit value
			this.rating('readOnly', true, true);
		},// $.fn.rating.disable
		
		enable: function(){ // make read/write and submit value
			this.rating('readOnly', false, false);
		}// $.fn.rating.select
		
 });
	
	/*--------------------------------------------------------*/
	
	/*
		### Default Settings ###
		eg.: You can override default control like this:
		$.fn.rating.options.cancel = 'Clear';
	*/
	$.fn.rating.options = { //$.extend($.fn.rating, { options: {
			cancel: 'Cancel Rating',   // advisory title for the 'cancel' link
			cancelValue: '',           // value to submit when user click the 'cancel' link
			split: 0,                  // split the star into how many parts?
			
			// Width of star image in case the plugin can't work it out. This can happen if
			// the jQuery.dimensions plugin is not available OR the image is hidden at installation
			starWidth: 16//,
			
			//NB.: These don't need to be pre-defined (can be undefined/null) so let's save some code!
			//half:     false,         // just a shortcut to control.split = 2
			//required: false,         // disables the 'cancel' button so user can only select one of the specified values
			//readOnly: false,         // disable rating plugin interaction/ values cannot be.one('change',		//focus:    function(){},  // executed when stars are focused
			//blur:     function(){},  // executed when stars are focused
			//callback: function(){},  // executed when a star is clicked
 }; //} });
	
	/*--------------------------------------------------------*/
	
	
	  // auto-initialize plugin
				$(function(){
				 $('input[type=radio].star').rating();
				});
	
	
/*# AVOID COLLISIONS #*/
})(jQuery);
/*# AVOID COLLISIONS #*/



/* jQuery elevateZoom 3.0.8 - Demo's and documentation: - www.elevateweb.co.uk/image-zoom - Copyright (c) 2013 Andrew Eades - www.elevateweb.co.uk - Dual licensed under the LGPL licenses. - http://en.wikipedia.org/wiki/MIT_License - http://en.wikipedia.org/wiki/GNU_General_Public_License */
"function"!==typeof Object.create&&(Object.create=function(d){function h(){}h.prototype=d;return new h});
(function(d,h,l,m){var k={init:function(b,a){var c=this;c.elem=a;c.$elem=d(a);c.imageSrc=c.$elem.data("zoom-image")?c.$elem.data("zoom-image"):c.$elem.attr("src");c.options=d.extend({},d.fn.elevateZoom.options,b);c.options.tint&&(c.options.lensColour="none",c.options.lensOpacity="1");"inner"==c.options.zoomType&&(c.options.showLens=!1);c.$elem.parent().removeAttr("title").removeAttr("alt");c.zoomImage=c.imageSrc;c.refresh(1);d("#"+c.options.gallery+" a").click(function(a){c.options.galleryActiveClass&&
(d("#"+c.options.gallery+" a").removeClass(c.options.galleryActiveClass),d(this).addClass(c.options.galleryActiveClass));a.preventDefault();d(this).data("zoom-image")?c.zoomImagePre=d(this).data("zoom-image"):c.zoomImagePre=d(this).data("image");c.swaptheimage(d(this).data("image"),c.zoomImagePre);return!1})},refresh:function(b){var a=this;setTimeout(function(){a.fetch(a.imageSrc)},b||a.options.refresh)},fetch:function(b){var a=this,c=new Image;c.onload=function(){a.largeWidth=c.width;a.largeHeight=
c.height;a.startZoom();a.currentImage=a.imageSrc;a.options.onZoomedImageLoaded(a.$elem)};c.src=b},startZoom:function(){var b=this;b.nzWidth=b.$elem.width();b.nzHeight=b.$elem.height();b.isWindowActive=!1;b.isLensActive=!1;b.isTintActive=!1;b.overWindow=!1;b.options.imageCrossfade&&(b.zoomWrap=b.$elem.wrap('<div style="height:'+b.nzHeight+"px;width:"+b.nzWidth+'px;" class="zoomWrapper" />'),b.$elem.css("position","absolute"));b.zoomLock=1;b.scrollingLock=!1;b.changeBgSize=!1;b.currentZoomLevel=b.options.zoomLevel;
b.nzOffset=b.$elem.offset();b.widthRatio=b.largeWidth/b.currentZoomLevel/b.nzWidth;b.heightRatio=b.largeHeight/b.currentZoomLevel/b.nzHeight;"window"==b.options.zoomType&&(b.zoomWindowStyle="overflow: hidden;background-position: 0px 0px;text-align:center;background-color: "+String(b.options.zoomWindowBgColour)+";width: "+String(b.options.zoomWindowWidth)+"px;height: "+String(b.options.zoomWindowHeight)+"px;float: left;background-size: "+b.largeWidth/b.currentZoomLevel+"px "+b.largeHeight/b.currentZoomLevel+
"px;display: none;z-index:100;border: "+String(b.options.borderSize)+"px solid "+b.options.borderColour+";background-repeat: no-repeat;position: absolute;");if("inner"==b.options.zoomType){var a=b.$elem.css("border-left-width");b.zoomWindowStyle="overflow: hidden;margin-left: "+String(a)+";margin-top: "+String(a)+";background-position: 0px 0px;width: "+String(b.nzWidth)+"px;height: "+String(b.nzHeight)+"px;float: left;display: none;cursor:"+b.options.cursor+";px solid "+b.options.borderColour+";background-repeat: no-repeat;position: absolute;"}"window"==
b.options.zoomType&&(lensHeight=b.nzHeight<b.options.zoomWindowWidth/b.widthRatio?b.nzHeight:String(b.options.zoomWindowHeight/b.heightRatio),lensWidth=b.largeWidth<b.options.zoomWindowWidth?b.nzWidth:b.options.zoomWindowWidth/b.widthRatio,b.lensStyle="background-position: 0px 0px;width: "+String(b.options.zoomWindowWidth/b.widthRatio)+"px;height: "+String(b.options.zoomWindowHeight/b.heightRatio)+"px;float: right;display: none;overflow: hidden;z-index: 999;-webkit-transform: translateZ(0);opacity:"+
b.options.lensOpacity+";filter: alpha(opacity = "+100*b.options.lensOpacity+"); zoom:1;width:"+lensWidth+"px;height:"+lensHeight+"px;background-color:"+b.options.lensColour+";cursor:"+b.options.cursor+";border: "+b.options.lensBorderSize+"px solid "+b.options.lensBorderColour+";background-repeat: no-repeat;position: absolute;");b.tintStyle="display: block;position: absolute;background-color: "+b.options.tintColour+";filter:alpha(opacity=0);opacity: 0;width: "+b.nzWidth+"px;height: "+b.nzHeight+"px;";
b.lensRound="";"lens"==b.options.zoomType&&(b.lensStyle="background-position: 0px 0px;float: left;display: none;border: "+String(b.options.borderSize)+"px solid "+b.options.borderColour+";width:"+String(b.options.lensSize)+"px;height:"+String(b.options.lensSize)+"px;background-repeat: no-repeat;position: absolute;");"round"==b.options.lensShape&&(b.lensRound="border-top-left-radius: "+String(b.options.lensSize/2+b.options.borderSize)+"px;border-top-right-radius: "+String(b.options.lensSize/2+b.options.borderSize)+
"px;border-bottom-left-radius: "+String(b.options.lensSize/2+b.options.borderSize)+"px;border-bottom-right-radius: "+String(b.options.lensSize/2+b.options.borderSize)+"px;");b.zoomContainer=d('<div class="zoomContainer" style="-webkit-transform: translateZ(0);position:absolute;left:'+b.nzOffset.left+"px;top:"+b.nzOffset.top+"px;height:"+b.nzHeight+"px;width:"+b.nzWidth+'px;"></div>');d("body").append(b.zoomContainer);b.options.containLensZoom&&"lens"==b.options.zoomType&&b.zoomContainer.css("overflow",
"hidden");"inner"!=b.options.zoomType&&(b.zoomLens=d("<div class='zoomLens' style='"+b.lensStyle+b.lensRound+"'>&nbsp;</div>").appendTo(b.zoomContainer).click(function(){b.$elem.trigger("click")}),b.options.tint&&(b.tintContainer=d("<div/>").addClass("tintContainer"),b.zoomTint=d("<div class='zoomTint' style='"+b.tintStyle+"'></div>"),b.zoomLens.wrap(b.tintContainer),b.zoomTintcss=b.zoomLens.after(b.zoomTint),b.zoomTintImage=d('<img style="position: absolute; left: 0px; top: 0px; max-width: none; width: '+
b.nzWidth+"px; height: "+b.nzHeight+'px;" src="'+b.imageSrc+'">').appendTo(b.zoomLens).click(function(){b.$elem.trigger("click")})));isNaN(b.options.zoomWindowPosition)?b.zoomWindow=d("<div style='z-index:999;left:"+b.windowOffsetLeft+"px;top:"+b.windowOffsetTop+"px;"+b.zoomWindowStyle+"' class='zoomWindow'>&nbsp;</div>").appendTo("body").click(function(){b.$elem.trigger("click")}):b.zoomWindow=d("<div style='z-index:999;left:"+b.windowOffsetLeft+"px;top:"+b.windowOffsetTop+"px;"+b.zoomWindowStyle+
"' class='zoomWindow'>&nbsp;</div>").appendTo(b.zoomContainer).click(function(){b.$elem.trigger("click")});b.zoomWindowContainer=d("<div/>").addClass("zoomWindowContainer").css("width",b.options.zoomWindowWidth);b.zoomWindow.wrap(b.zoomWindowContainer);"lens"==b.options.zoomType&&b.zoomLens.css({backgroundImage:"url('"+b.imageSrc+"')"});"window"==b.options.zoomType&&b.zoomWindow.css({backgroundImage:"url('"+b.imageSrc+"')"});"inner"==b.options.zoomType&&b.zoomWindow.css({backgroundImage:"url('"+b.imageSrc+
"')"});b.$elem.bind("touchmove",function(a){a.preventDefault();b.setPosition(a.originalEvent.touches[0]||a.originalEvent.changedTouches[0])});b.zoomContainer.bind("touchmove",function(a){"inner"==b.options.zoomType&&b.showHideWindow("show");a.preventDefault();b.setPosition(a.originalEvent.touches[0]||a.originalEvent.changedTouches[0])});b.zoomContainer.bind("touchend",function(a){b.showHideWindow("hide");b.options.showLens&&b.showHideLens("hide");b.options.tint&&"inner"!=b.options.zoomType&&b.showHideTint("hide")});
b.$elem.bind("touchend",function(a){b.showHideWindow("hide");b.options.showLens&&b.showHideLens("hide");b.options.tint&&"inner"!=b.options.zoomType&&b.showHideTint("hide")});b.options.showLens&&(b.zoomLens.bind("touchmove",function(a){a.preventDefault();b.setPosition(a.originalEvent.touches[0]||a.originalEvent.changedTouches[0])}),b.zoomLens.bind("touchend",function(a){b.showHideWindow("hide");b.options.showLens&&b.showHideLens("hide");b.options.tint&&"inner"!=b.options.zoomType&&b.showHideTint("hide")}));
b.$elem.bind("mousemove",function(a){!1==b.overWindow&&b.setElements("show");if(b.lastX!==a.clientX||b.lastY!==a.clientY)b.setPosition(a),b.currentLoc=a;b.lastX=a.clientX;b.lastY=a.clientY});b.zoomContainer.bind("mousemove",function(a){!1==b.overWindow&&b.setElements("show");if(b.lastX!==a.clientX||b.lastY!==a.clientY)b.setPosition(a),b.currentLoc=a;b.lastX=a.clientX;b.lastY=a.clientY});"inner"!=b.options.zoomType&&b.zoomLens.bind("mousemove",function(a){if(b.lastX!==a.clientX||b.lastY!==a.clientY)b.setPosition(a),
b.currentLoc=a;b.lastX=a.clientX;b.lastY=a.clientY});b.options.tint&&"inner"!=b.options.zoomType&&b.zoomTint.bind("mousemove",function(a){if(b.lastX!==a.clientX||b.lastY!==a.clientY)b.setPosition(a),b.currentLoc=a;b.lastX=a.clientX;b.lastY=a.clientY});"inner"==b.options.zoomType&&b.zoomWindow.bind("mousemove",function(a){if(b.lastX!==a.clientX||b.lastY!==a.clientY)b.setPosition(a),b.currentLoc=a;b.lastX=a.clientX;b.lastY=a.clientY});b.zoomContainer.add(b.$elem).mouseenter(function(){!1==b.overWindow&&
b.setElements("show")}).mouseleave(function(){b.scrollLock||b.setElements("hide")});"inner"!=b.options.zoomType&&b.zoomWindow.mouseenter(function(){b.overWindow=!0;b.setElements("hide")}).mouseleave(function(){b.overWindow=!1});b.minZoomLevel=b.options.minZoomLevel?b.options.minZoomLevel:2*b.options.scrollZoomIncrement;b.options.scrollZoom&&b.zoomContainer.add(b.$elem).bind("mousewheel DOMMouseScroll MozMousePixelScroll",function(a){b.scrollLock=!0;clearTimeout(d.data(this,"timer"));d.data(this,"timer",
setTimeout(function(){b.scrollLock=!1},250));var e=a.originalEvent.wheelDelta||-1*a.originalEvent.detail;a.stopImmediatePropagation();a.stopPropagation();a.preventDefault();0<e/120?b.currentZoomLevel>=b.minZoomLevel&&b.changeZoomLevel(b.currentZoomLevel-b.options.scrollZoomIncrement):b.options.maxZoomLevel?b.currentZoomLevel<=b.options.maxZoomLevel&&b.changeZoomLevel(parseFloat(b.currentZoomLevel)+b.options.scrollZoomIncrement):b.changeZoomLevel(parseFloat(b.currentZoomLevel)+b.options.scrollZoomIncrement);
return!1})},setElements:function(b){if(!this.options.zoomEnabled)return!1;"show"==b&&this.isWindowSet&&("inner"==this.options.zoomType&&this.showHideWindow("show"),"window"==this.options.zoomType&&this.showHideWindow("show"),this.options.showLens&&this.showHideLens("show"),this.options.tint&&"inner"!=this.options.zoomType&&this.showHideTint("show"));"hide"==b&&("window"==this.options.zoomType&&this.showHideWindow("hide"),this.options.tint||this.showHideWindow("hide"),this.options.showLens&&this.showHideLens("hide"),
this.options.tint&&this.showHideTint("hide"))},setPosition:function(b){if(!this.options.zoomEnabled)return!1;this.nzHeight=this.$elem.height();this.nzWidth=this.$elem.width();this.nzOffset=this.$elem.offset();this.options.tint&&"inner"!=this.options.zoomType&&(this.zoomTint.css({top:0}),this.zoomTint.css({left:0}));this.options.responsive&&!this.options.scrollZoom&&this.options.showLens&&(lensHeight=this.nzHeight<this.options.zoomWindowWidth/this.widthRatio?this.nzHeight:String(this.options.zoomWindowHeight/
this.heightRatio),lensWidth=this.largeWidth<this.options.zoomWindowWidth?this.nzWidth:this.options.zoomWindowWidth/this.widthRatio,this.widthRatio=this.largeWidth/this.nzWidth,this.heightRatio=this.largeHeight/this.nzHeight,"lens"!=this.options.zoomType&&(lensHeight=this.nzHeight<this.options.zoomWindowWidth/this.widthRatio?this.nzHeight:String(this.options.zoomWindowHeight/this.heightRatio),lensWidth=this.options.zoomWindowWidth<this.options.zoomWindowWidth?this.nzWidth:this.options.zoomWindowWidth/
this.widthRatio,this.zoomLens.css("width",lensWidth),this.zoomLens.css("height",lensHeight),this.options.tint&&(this.zoomTintImage.css("width",this.nzWidth),this.zoomTintImage.css("height",this.nzHeight))),"lens"==this.options.zoomType&&this.zoomLens.css({width:String(this.options.lensSize)+"px",height:String(this.options.lensSize)+"px"}));this.zoomContainer.css({top:this.nzOffset.top});this.zoomContainer.css({left:this.nzOffset.left});this.mouseLeft=parseInt(b.pageX-this.nzOffset.left);this.mouseTop=
parseInt(b.pageY-this.nzOffset.top);"window"==this.options.zoomType&&(this.Etoppos=this.mouseTop<this.zoomLens.height()/2,this.Eboppos=this.mouseTop>this.nzHeight-this.zoomLens.height()/2-2*this.options.lensBorderSize,this.Eloppos=this.mouseLeft<0+this.zoomLens.width()/2,this.Eroppos=this.mouseLeft>this.nzWidth-this.zoomLens.width()/2-2*this.options.lensBorderSize);"inner"==this.options.zoomType&&(this.Etoppos=this.mouseTop<this.nzHeight/2/this.heightRatio,this.Eboppos=this.mouseTop>this.nzHeight-
this.nzHeight/2/this.heightRatio,this.Eloppos=this.mouseLeft<0+this.nzWidth/2/this.widthRatio,this.Eroppos=this.mouseLeft>this.nzWidth-this.nzWidth/2/this.widthRatio-2*this.options.lensBorderSize);0>=this.mouseLeft||0>this.mouseTop||this.mouseLeft>this.nzWidth||this.mouseTop>this.nzHeight?this.setElements("hide"):(this.options.showLens&&(this.lensLeftPos=String(this.mouseLeft-this.zoomLens.width()/2),this.lensTopPos=String(this.mouseTop-this.zoomLens.height()/2)),this.Etoppos&&(this.lensTopPos=0),
this.Eloppos&&(this.tintpos=this.lensLeftPos=this.windowLeftPos=0),"window"==this.options.zoomType&&(this.Eboppos&&(this.lensTopPos=Math.max(this.nzHeight-this.zoomLens.height()-2*this.options.lensBorderSize,0)),this.Eroppos&&(this.lensLeftPos=this.nzWidth-this.zoomLens.width()-2*this.options.lensBorderSize)),"inner"==this.options.zoomType&&(this.Eboppos&&(this.lensTopPos=Math.max(this.nzHeight-2*this.options.lensBorderSize,0)),this.Eroppos&&(this.lensLeftPos=this.nzWidth-this.nzWidth-2*this.options.lensBorderSize)),
"lens"==this.options.zoomType&&(this.windowLeftPos=String(-1*((b.pageX-this.nzOffset.left)*this.widthRatio-this.zoomLens.width()/2)),this.windowTopPos=String(-1*((b.pageY-this.nzOffset.top)*this.heightRatio-this.zoomLens.height()/2)),this.zoomLens.css({backgroundPosition:this.windowLeftPos+"px "+this.windowTopPos+"px"}),this.changeBgSize&&(this.nzHeight>this.nzWidth?("lens"==this.options.zoomType&&this.zoomLens.css({"background-size":this.largeWidth/this.newvalueheight+"px "+this.largeHeight/this.newvalueheight+
"px"}),this.zoomWindow.css({"background-size":this.largeWidth/this.newvalueheight+"px "+this.largeHeight/this.newvalueheight+"px"})):("lens"==this.options.zoomType&&this.zoomLens.css({"background-size":this.largeWidth/this.newvaluewidth+"px "+this.largeHeight/this.newvaluewidth+"px"}),this.zoomWindow.css({"background-size":this.largeWidth/this.newvaluewidth+"px "+this.largeHeight/this.newvaluewidth+"px"})),this.changeBgSize=!1),this.setWindowPostition(b)),this.options.tint&&"inner"!=this.options.zoomType&&
this.setTintPosition(b),"window"==this.options.zoomType&&this.setWindowPostition(b),"inner"==this.options.zoomType&&this.setWindowPostition(b),this.options.showLens&&(this.fullwidth&&"lens"!=this.options.zoomType&&(this.lensLeftPos=0),this.zoomLens.css({left:this.lensLeftPos+"px",top:this.lensTopPos+"px"})))},showHideWindow:function(b){"show"!=b||this.isWindowActive||(this.options.zoomWindowFadeIn?this.zoomWindow.stop(!0,!0,!1).fadeIn(this.options.zoomWindowFadeIn):this.zoomWindow.show(),this.isWindowActive=
!0);"hide"==b&&this.isWindowActive&&(this.options.zoomWindowFadeOut?this.zoomWindow.stop(!0,!0).fadeOut(this.options.zoomWindowFadeOut):this.zoomWindow.hide(),this.isWindowActive=!1)},showHideLens:function(b){"show"!=b||this.isLensActive||(this.options.lensFadeIn?this.zoomLens.stop(!0,!0,!1).fadeIn(this.options.lensFadeIn):this.zoomLens.show(),this.isLensActive=!0);"hide"==b&&this.isLensActive&&(this.options.lensFadeOut?this.zoomLens.stop(!0,!0).fadeOut(this.options.lensFadeOut):this.zoomLens.hide(),
this.isLensActive=!1)},showHideTint:function(b){"show"!=b||this.isTintActive||(this.options.zoomTintFadeIn?this.zoomTint.css({opacity:this.options.tintOpacity}).animate().stop(!0,!0).fadeIn("slow"):(this.zoomTint.css({opacity:this.options.tintOpacity}).animate(),this.zoomTint.show()),this.isTintActive=!0);"hide"==b&&this.isTintActive&&(this.options.zoomTintFadeOut?this.zoomTint.stop(!0,!0).fadeOut(this.options.zoomTintFadeOut):this.zoomTint.hide(),this.isTintActive=!1)},setLensPostition:function(b){},
setWindowPostition:function(b){var a=this;if(isNaN(a.options.zoomWindowPosition))a.externalContainer=d("#"+a.options.zoomWindowPosition),a.externalContainerWidth=a.externalContainer.width(),a.externalContainerHeight=a.externalContainer.height(),a.externalContainerOffset=a.externalContainer.offset(),a.windowOffsetTop=a.externalContainerOffset.top,a.windowOffsetLeft=a.externalContainerOffset.left;else switch(a.options.zoomWindowPosition){case 1:a.windowOffsetTop=a.options.zoomWindowOffety;a.windowOffsetLeft=
+a.nzWidth;break;case 2:a.options.zoomWindowHeight>a.nzHeight&&(a.windowOffsetTop=-1*(a.options.zoomWindowHeight/2-a.nzHeight/2),a.windowOffsetLeft=a.nzWidth);break;case 3:a.windowOffsetTop=a.nzHeight-a.zoomWindow.height()-2*a.options.borderSize;a.windowOffsetLeft=a.nzWidth;break;case 4:a.windowOffsetTop=a.nzHeight;a.windowOffsetLeft=a.nzWidth;break;case 5:a.windowOffsetTop=a.nzHeight;a.windowOffsetLeft=a.nzWidth-a.zoomWindow.width()-2*a.options.borderSize;break;case 6:a.options.zoomWindowHeight>
a.nzHeight&&(a.windowOffsetTop=a.nzHeight,a.windowOffsetLeft=-1*(a.options.zoomWindowWidth/2-a.nzWidth/2+2*a.options.borderSize));break;case 7:a.windowOffsetTop=a.nzHeight;a.windowOffsetLeft=0;break;case 8:a.windowOffsetTop=a.nzHeight;a.windowOffsetLeft=-1*(a.zoomWindow.width()+2*a.options.borderSize);break;case 9:a.windowOffsetTop=a.nzHeight-a.zoomWindow.height()-2*a.options.borderSize;a.windowOffsetLeft=-1*(a.zoomWindow.width()+2*a.options.borderSize);break;case 10:a.options.zoomWindowHeight>a.nzHeight&&
(a.windowOffsetTop=-1*(a.options.zoomWindowHeight/2-a.nzHeight/2),a.windowOffsetLeft=-1*(a.zoomWindow.width()+2*a.options.borderSize));break;case 11:a.windowOffsetTop=a.options.zoomWindowOffety;a.windowOffsetLeft=-1*(a.zoomWindow.width()+2*a.options.borderSize);break;case 12:a.windowOffsetTop=-1*(a.zoomWindow.height()+2*a.options.borderSize);a.windowOffsetLeft=-1*(a.zoomWindow.width()+2*a.options.borderSize);break;case 13:a.windowOffsetTop=-1*(a.zoomWindow.height()+2*a.options.borderSize);a.windowOffsetLeft=
0;break;case 14:a.options.zoomWindowHeight>a.nzHeight&&(a.windowOffsetTop=-1*(a.zoomWindow.height()+2*a.options.borderSize),a.windowOffsetLeft=-1*(a.options.zoomWindowWidth/2-a.nzWidth/2+2*a.options.borderSize));break;case 15:a.windowOffsetTop=-1*(a.zoomWindow.height()+2*a.options.borderSize);a.windowOffsetLeft=a.nzWidth-a.zoomWindow.width()-2*a.options.borderSize;break;case 16:a.windowOffsetTop=-1*(a.zoomWindow.height()+2*a.options.borderSize);a.windowOffsetLeft=a.nzWidth;break;default:a.windowOffsetTop=
a.options.zoomWindowOffety,a.windowOffsetLeft=a.nzWidth}a.isWindowSet=!0;a.windowOffsetTop+=a.options.zoomWindowOffety;a.windowOffsetLeft+=a.options.zoomWindowOffetx;a.zoomWindow.css({top:a.windowOffsetTop});a.zoomWindow.css({left:a.windowOffsetLeft});"inner"==a.options.zoomType&&(a.zoomWindow.css({top:0}),a.zoomWindow.css({left:0}));a.windowLeftPos=String(-1*((b.pageX-a.nzOffset.left)*a.widthRatio-a.zoomWindow.width()/2));a.windowTopPos=String(-1*((b.pageY-a.nzOffset.top)*a.heightRatio-a.zoomWindow.height()/
2));a.Etoppos&&(a.windowTopPos=0);a.Eloppos&&(a.windowLeftPos=0);a.Eboppos&&(a.windowTopPos=-1*(a.largeHeight/a.currentZoomLevel-a.zoomWindow.height()));a.Eroppos&&(a.windowLeftPos=-1*(a.largeWidth/a.currentZoomLevel-a.zoomWindow.width()));a.fullheight&&(a.windowTopPos=0);a.fullwidth&&(a.windowLeftPos=0);if("window"==a.options.zoomType||"inner"==a.options.zoomType)1==a.zoomLock&&(1>=a.widthRatio&&(a.windowLeftPos=0),1>=a.heightRatio&&(a.windowTopPos=0)),a.largeHeight<a.options.zoomWindowHeight&&(a.windowTopPos=
0),a.largeWidth<a.options.zoomWindowWidth&&(a.windowLeftPos=0),a.options.easing?(a.xp||(a.xp=0),a.yp||(a.yp=0),a.loop||(a.loop=setInterval(function(){a.xp+=(a.windowLeftPos-a.xp)/a.options.easingAmount;a.yp+=(a.windowTopPos-a.yp)/a.options.easingAmount;a.scrollingLock?(clearInterval(a.loop),a.xp=a.windowLeftPos,a.yp=a.windowTopPos,a.xp=-1*((b.pageX-a.nzOffset.left)*a.widthRatio-a.zoomWindow.width()/2),a.yp=-1*((b.pageY-a.nzOffset.top)*a.heightRatio-a.zoomWindow.height()/2),a.changeBgSize&&(a.nzHeight>
a.nzWidth?("lens"==a.options.zoomType&&a.zoomLens.css({"background-size":a.largeWidth/a.newvalueheight+"px "+a.largeHeight/a.newvalueheight+"px"}),a.zoomWindow.css({"background-size":a.largeWidth/a.newvalueheight+"px "+a.largeHeight/a.newvalueheight+"px"})):("lens"!=a.options.zoomType&&a.zoomLens.css({"background-size":a.largeWidth/a.newvaluewidth+"px "+a.largeHeight/a.newvalueheight+"px"}),a.zoomWindow.css({"background-size":a.largeWidth/a.newvaluewidth+"px "+a.largeHeight/a.newvaluewidth+"px"})),
a.changeBgSize=!1),a.zoomWindow.css({backgroundPosition:a.windowLeftPos+"px "+a.windowTopPos+"px"}),a.scrollingLock=!1,a.loop=!1):(a.changeBgSize&&(a.nzHeight>a.nzWidth?("lens"==a.options.zoomType&&a.zoomLens.css({"background-size":a.largeWidth/a.newvalueheight+"px "+a.largeHeight/a.newvalueheight+"px"}),a.zoomWindow.css({"background-size":a.largeWidth/a.newvalueheight+"px "+a.largeHeight/a.newvalueheight+"px"})):("lens"!=a.options.zoomType&&a.zoomLens.css({"background-size":a.largeWidth/a.newvaluewidth+
"px "+a.largeHeight/a.newvaluewidth+"px"}),a.zoomWindow.css({"background-size":a.largeWidth/a.newvaluewidth+"px "+a.largeHeight/a.newvaluewidth+"px"})),a.changeBgSize=!1),a.zoomWindow.css({backgroundPosition:a.xp+"px "+a.yp+"px"}))},16))):(a.changeBgSize&&(a.nzHeight>a.nzWidth?("lens"==a.options.zoomType&&a.zoomLens.css({"background-size":a.largeWidth/a.newvalueheight+"px "+a.largeHeight/a.newvalueheight+"px"}),a.zoomWindow.css({"background-size":a.largeWidth/a.newvalueheight+"px "+a.largeHeight/
a.newvalueheight+"px"})):("lens"==a.options.zoomType&&a.zoomLens.css({"background-size":a.largeWidth/a.newvaluewidth+"px "+a.largeHeight/a.newvaluewidth+"px"}),a.largeHeight/a.newvaluewidth<a.options.zoomWindowHeight?a.zoomWindow.css({"background-size":a.largeWidth/a.newvaluewidth+"px "+a.largeHeight/a.newvaluewidth+"px"}):a.zoomWindow.css({"background-size":a.largeWidth/a.newvalueheight+"px "+a.largeHeight/a.newvalueheight+"px"})),a.changeBgSize=!1),a.zoomWindow.css({backgroundPosition:a.windowLeftPos+
"px "+a.windowTopPos+"px"}))},setTintPosition:function(b){this.nzOffset=this.$elem.offset();this.tintpos=String(-1*(b.pageX-this.nzOffset.left-this.zoomLens.width()/2));this.tintposy=String(-1*(b.pageY-this.nzOffset.top-this.zoomLens.height()/2));this.Etoppos&&(this.tintposy=0);this.Eloppos&&(this.tintpos=0);this.Eboppos&&(this.tintposy=-1*(this.nzHeight-this.zoomLens.height()-2*this.options.lensBorderSize));this.Eroppos&&(this.tintpos=-1*(this.nzWidth-this.zoomLens.width()-2*this.options.lensBorderSize));
this.options.tint&&(this.fullheight&&(this.tintposy=0),this.fullwidth&&(this.tintpos=0),this.zoomTintImage.css({left:this.tintpos+"px"}),this.zoomTintImage.css({top:this.tintposy+"px"}))},swaptheimage:function(b,a){var c=this,e=new Image;c.options.loadingIcon&&(c.spinner=d("<div style=\"background: url('"+c.options.loadingIcon+"') no-repeat center;height:"+c.nzHeight+"px;width:"+c.nzWidth+'px;z-index: 2000;position: absolute; background-position: center center;"></div>'),c.$elem.after(c.spinner));
c.options.onImageSwap(c.$elem);e.onload=function(){c.largeWidth=e.width;c.largeHeight=e.height;c.zoomImage=a;c.zoomWindow.css({"background-size":c.largeWidth+"px "+c.largeHeight+"px"});c.zoomWindow.css({"background-size":c.largeWidth+"px "+c.largeHeight+"px"});c.swapAction(b,a)};e.src=a},swapAction:function(b,a){var c=this,e=new Image;e.onload=function(){c.nzHeight=e.height;c.nzWidth=e.width;c.options.onImageSwapComplete(c.$elem);c.doneCallback()};e.src=b;c.currentZoomLevel=c.options.zoomLevel;c.options.maxZoomLevel=
!1;"lens"==c.options.zoomType&&c.zoomLens.css({backgroundImage:"url('"+a+"')"});"window"==c.options.zoomType&&c.zoomWindow.css({backgroundImage:"url('"+a+"')"});"inner"==c.options.zoomType&&c.zoomWindow.css({backgroundImage:"url('"+a+"')"});c.currentImage=a;if(c.options.imageCrossfade){var f=c.$elem,g=f.clone();c.$elem.attr("src",b);c.$elem.after(g);g.stop(!0).fadeOut(c.options.imageCrossfade,function(){d(this).remove()});c.$elem.width("auto").removeAttr("width");c.$elem.height("auto").removeAttr("height");
f.fadeIn(c.options.imageCrossfade);c.options.tint&&"inner"!=c.options.zoomType&&(f=c.zoomTintImage,g=f.clone(),c.zoomTintImage.attr("src",a),c.zoomTintImage.after(g),g.stop(!0).fadeOut(c.options.imageCrossfade,function(){d(this).remove()}),f.fadeIn(c.options.imageCrossfade),c.zoomTint.css({height:c.$elem.height()}),c.zoomTint.css({width:c.$elem.width()}));c.zoomContainer.css("height",c.$elem.height());c.zoomContainer.css("width",c.$elem.width());"inner"!=c.options.zoomType||c.options.constrainType||
(c.zoomWrap.parent().css("height",c.$elem.height()),c.zoomWrap.parent().css("width",c.$elem.width()),c.zoomWindow.css("height",c.$elem.height()),c.zoomWindow.css("width",c.$elem.width()))}else c.$elem.attr("src",b),c.options.tint&&(c.zoomTintImage.attr("src",a),c.zoomTintImage.attr("height",c.$elem.height()),c.zoomTintImage.css({height:c.$elem.height()}),c.zoomTint.css({height:c.$elem.height()})),c.zoomContainer.css("height",c.$elem.height()),c.zoomContainer.css("width",c.$elem.width());c.options.imageCrossfade&&
(c.zoomWrap.css("height",c.$elem.height()),c.zoomWrap.css("width",c.$elem.width()));c.options.constrainType&&("height"==c.options.constrainType&&(c.zoomContainer.css("height",c.options.constrainSize),c.zoomContainer.css("width","auto"),c.options.imageCrossfade?(c.zoomWrap.css("height",c.options.constrainSize),c.zoomWrap.css("width","auto"),c.constwidth=c.zoomWrap.width()):(c.$elem.css("height",c.options.constrainSize),c.$elem.css("width","auto"),c.constwidth=c.$elem.width()),"inner"==c.options.zoomType&&
(c.zoomWrap.parent().css("height",c.options.constrainSize),c.zoomWrap.parent().css("width",c.constwidth),c.zoomWindow.css("height",c.options.constrainSize),c.zoomWindow.css("width",c.constwidth)),c.options.tint&&(c.tintContainer.css("height",c.options.constrainSize),c.tintContainer.css("width",c.constwidth),c.zoomTint.css("height",c.options.constrainSize),c.zoomTint.css("width",c.constwidth),c.zoomTintImage.css("height",c.options.constrainSize),c.zoomTintImage.css("width",c.constwidth))),"width"==
c.options.constrainType&&(c.zoomContainer.css("height","auto"),c.zoomContainer.css("width",c.options.constrainSize),c.options.imageCrossfade?(c.zoomWrap.css("height","auto"),c.zoomWrap.css("width",c.options.constrainSize),c.constheight=c.zoomWrap.height()):(c.$elem.css("height","auto"),c.$elem.css("width",c.options.constrainSize),c.constheight=c.$elem.height()),"inner"==c.options.zoomType&&(c.zoomWrap.parent().css("height",c.constheight),c.zoomWrap.parent().css("width",c.options.constrainSize),c.zoomWindow.css("height",
c.constheight),c.zoomWindow.css("width",c.options.constrainSize)),c.options.tint&&(c.tintContainer.css("height",c.constheight),c.tintContainer.css("width",c.options.constrainSize),c.zoomTint.css("height",c.constheight),c.zoomTint.css("width",c.options.constrainSize),c.zoomTintImage.css("height",c.constheight),c.zoomTintImage.css("width",c.options.constrainSize))))},doneCallback:function(){this.options.loadingIcon&&this.spinner.hide();this.nzOffset=this.$elem.offset();this.nzWidth=this.$elem.width();
this.nzHeight=this.$elem.height();this.currentZoomLevel=this.options.zoomLevel;this.widthRatio=this.largeWidth/this.nzWidth;this.heightRatio=this.largeHeight/this.nzHeight;"window"==this.options.zoomType&&(lensHeight=this.nzHeight<this.options.zoomWindowWidth/this.widthRatio?this.nzHeight:String(this.options.zoomWindowHeight/this.heightRatio),lensWidth=this.options.zoomWindowWidth<this.options.zoomWindowWidth?this.nzWidth:this.options.zoomWindowWidth/this.widthRatio,this.zoomLens&&(this.zoomLens.css("width",
lensWidth),this.zoomLens.css("height",lensHeight)))},getCurrentImage:function(){return this.zoomImage},getGalleryList:function(){var b=this;b.gallerylist=[];b.options.gallery?d("#"+b.options.gallery+" a").each(function(){var a="";d(this).data("zoom-image")?a=d(this).data("zoom-image"):d(this).data("image")&&(a=d(this).data("image"));a==b.zoomImage?b.gallerylist.unshift({href:""+a+"",title:d(this).find("img").attr("title")}):b.gallerylist.push({href:""+a+"",title:d(this).find("img").attr("title")})}):
b.gallerylist.push({href:""+b.zoomImage+"",title:d(this).find("img").attr("title")});return b.gallerylist},changeZoomLevel:function(b){this.scrollingLock=!0;this.newvalue=parseFloat(b).toFixed(2);newvalue=parseFloat(b).toFixed(2);maxheightnewvalue=this.largeHeight/(this.options.zoomWindowHeight/this.nzHeight*this.nzHeight);maxwidthtnewvalue=this.largeWidth/(this.options.zoomWindowWidth/this.nzWidth*this.nzWidth);"inner"!=this.options.zoomType&&(maxheightnewvalue<=newvalue?(this.heightRatio=this.largeHeight/
maxheightnewvalue/this.nzHeight,this.newvalueheight=maxheightnewvalue,this.fullheight=!0):(this.heightRatio=this.largeHeight/newvalue/this.nzHeight,this.newvalueheight=newvalue,this.fullheight=!1),maxwidthtnewvalue<=newvalue?(this.widthRatio=this.largeWidth/maxwidthtnewvalue/this.nzWidth,this.newvaluewidth=maxwidthtnewvalue,this.fullwidth=!0):(this.widthRatio=this.largeWidth/newvalue/this.nzWidth,this.newvaluewidth=newvalue,this.fullwidth=!1),"lens"==this.options.zoomType&&(maxheightnewvalue<=newvalue?
(this.fullwidth=!0,this.newvaluewidth=maxheightnewvalue):(this.widthRatio=this.largeWidth/newvalue/this.nzWidth,this.newvaluewidth=newvalue,this.fullwidth=!1)));"inner"==this.options.zoomType&&(maxheightnewvalue=parseFloat(this.largeHeight/this.nzHeight).toFixed(2),maxwidthtnewvalue=parseFloat(this.largeWidth/this.nzWidth).toFixed(2),newvalue>maxheightnewvalue&&(newvalue=maxheightnewvalue),newvalue>maxwidthtnewvalue&&(newvalue=maxwidthtnewvalue),maxheightnewvalue<=newvalue?(this.heightRatio=this.largeHeight/
newvalue/this.nzHeight,this.newvalueheight=newvalue>maxheightnewvalue?maxheightnewvalue:newvalue,this.fullheight=!0):(this.heightRatio=this.largeHeight/newvalue/this.nzHeight,this.newvalueheight=newvalue>maxheightnewvalue?maxheightnewvalue:newvalue,this.fullheight=!1),maxwidthtnewvalue<=newvalue?(this.widthRatio=this.largeWidth/newvalue/this.nzWidth,this.newvaluewidth=newvalue>maxwidthtnewvalue?maxwidthtnewvalue:newvalue,this.fullwidth=!0):(this.widthRatio=this.largeWidth/newvalue/this.nzWidth,this.newvaluewidth=
newvalue,this.fullwidth=!1));scrcontinue=!1;"inner"==this.options.zoomType&&(this.nzWidth>this.nzHeight&&(this.newvaluewidth<=maxwidthtnewvalue?scrcontinue=!0:(scrcontinue=!1,this.fullwidth=this.fullheight=!0)),this.nzHeight>this.nzWidth&&(this.newvaluewidth<=maxwidthtnewvalue?scrcontinue=!0:(scrcontinue=!1,this.fullwidth=this.fullheight=!0)));"inner"!=this.options.zoomType&&(scrcontinue=!0);scrcontinue&&(this.zoomLock=0,this.changeZoom=!0,this.options.zoomWindowHeight/this.heightRatio<=this.nzHeight&&
(this.currentZoomLevel=this.newvalueheight,"lens"!=this.options.zoomType&&"inner"!=this.options.zoomType&&(this.changeBgSize=!0,this.zoomLens.css({height:String(this.options.zoomWindowHeight/this.heightRatio)+"px"})),"lens"==this.options.zoomType||"inner"==this.options.zoomType)&&(this.changeBgSize=!0),this.options.zoomWindowWidth/this.widthRatio<=this.nzWidth&&("inner"!=this.options.zoomType&&this.newvaluewidth>this.newvalueheight&&(this.currentZoomLevel=this.newvaluewidth),"lens"!=this.options.zoomType&&
"inner"!=this.options.zoomType&&(this.changeBgSize=!0,this.zoomLens.css({width:String(this.options.zoomWindowWidth/this.widthRatio)+"px"})),"lens"==this.options.zoomType||"inner"==this.options.zoomType)&&(this.changeBgSize=!0),"inner"==this.options.zoomType&&(this.changeBgSize=!0,this.nzWidth>this.nzHeight&&(this.currentZoomLevel=this.newvaluewidth),this.nzHeight>this.nzWidth&&(this.currentZoomLevel=this.newvaluewidth)));this.setPosition(this.currentLoc)},closeAll:function(){self.zoomWindow&&self.zoomWindow.hide();
self.zoomLens&&self.zoomLens.hide();self.zoomTint&&self.zoomTint.hide()},changeState:function(b){"enable"==b&&(this.options.zoomEnabled=!0);"disable"==b&&(this.options.zoomEnabled=!1)}};d.fn.elevateZoom=function(b){return this.each(function(){var a=Object.create(k);a.init(b,this);d.data(this,"elevateZoom",a)})};d.fn.elevateZoom.options={zoomActivation:"hover",zoomEnabled:!0,preloading:1,zoomLevel:1,scrollZoom:!1,scrollZoomIncrement:0.1,minZoomLevel:!1,maxZoomLevel:!1,easing:!1,easingAmount:12,lensSize:200,
zoomWindowWidth:400,zoomWindowHeight:400,zoomWindowOffetx:0,zoomWindowOffety:0,zoomWindowPosition:1,zoomWindowBgColour:"#fff",lensFadeIn:!1,lensFadeOut:!1,debug:!1,zoomWindowFadeIn:!1,zoomWindowFadeOut:!1,zoomWindowAlwaysShow:!1,zoomTintFadeIn:!1,zoomTintFadeOut:!1,borderSize:4,showLens:!0,borderColour:"#888",lensBorderSize:1,lensBorderColour:"#000",lensShape:"square",zoomType:"window",containLensZoom:!1,lensColour:"white",lensOpacity:0.4,lenszoom:!1,tint:!1,tintColour:"#333",tintOpacity:0.4,gallery:!1,
galleryActiveClass:"zoomGalleryActive",imageCrossfade:!1,constrainType:!1,constrainSize:!1,loadingIcon:!1,cursor:"default",responsive:!0,onComplete:d.noop,onZoomedImageLoaded:function(){},onImageSwap:d.noop,onImageSwapComplete:d.noop}})(jQuery,window,document);





$(window).load(function () {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent)) {
        $('body').addClass('ios');
    };
    $('body').removeClass('loaded');
    $('.js-vertical-scroll').mCustomScrollbar();
});
$(function () {
    $(document).foundation();
    if ($.browser.msie) {
        $('input[placeholder]').each(function () {
            var input = $(this);
            $(input).val(input.attr('placeholder'));
            $(input).focus(function () {
                if (input.val() == input.attr('placeholder')) {
                    input.val('');
                }
            });
            $(input).blur(function () {
                if (input.val() == '' || input.val() == input.attr('placeholder')) {
                    input.val(input.attr('placeholder'));
                }
            });
        });
    };
    if ($.browser.msie) {
        $('textarea[placeholder]').each(function () {
            var input = $(this);
            $(input).val(input.attr('placeholder'));
            $(input).focus(function () {
                if (input.val() == input.attr('placeholder')) {
                    input.val('');
                }
            });
            $(input).blur(function () {
                if (input.val() == '' || input.val() == input.attr('placeholder')) {
                    input.val(input.attr('placeholder'));
                }
            });
        });
    };
    $('input, textarea').each(function () {
        var placeholder = $(this).attr('placeholder');
        $(this).focus(function () {
            $(this).attr('placeholder', '');
            return false;
        });
        $(this).focusout(function () {
            $(this).attr('placeholder', placeholder);
            return false;
        });
    });
    $('.btn-open-search').click(function () {
        $(this).toggleClass('active'), $('.box-search__toggle').fadeIn(0);
        return false;
    });

   	if ($('.main-slider').length) {
		$('.main-slider').slick({
			dots: true,
			infinite: true,
			speed: 300,
			slidesToShow: 1,
			adaptiveHeight: true,
			fade: true
		});
	};
	if ($('.gallery-product').length) {
		$('.gallery-product').slick({
			infinite: true,
			speed: 300,
			adaptiveHeight: true,
			autoplay: true,
			autoplaySpeed: 2000,
			slidesToShow: 6,
			responsive: [{
				breakpoint: 1100,
				settings: {
					slidesToShow: 5,
					slidesToScroll: 1
				}
			}, {
				breakpoint: 991,
				settings: {
					slidesToShow: 3,
					slidesToScroll: 1
				}
			}, {
				breakpoint: 767,
				settings: {
					slidesToShow: 2,
					slidesToScroll: 1
				}
			}, {
				breakpoint: 500,
				settings: {
					slidesToShow: 1,
					slidesToScroll: 1
				}
			}]
		});
	};	
	
	
    $('.slick-next-btn').click(function () {
        $(this).parent().find('.slick-next').click();
        return false;
    });
    $('.slick-prev-btn').click(function () {
        $(this).parent().find('.slick-prev').click();
        return false;
    });
    $(".js-show-more").toggle(function () {
        $(this).parents('.js-parents-toggle').find('.js-toggle-open').addClass('close');
		$(this).parents('.js-parents-toggle').find('.js-toggle-close').addClass('open');
        $(this).find('.button-slide-down__name').text("Скрыть");
        $(this).addClass('active');
		$('html, body').animate({scrollTop: $('.js-scroll').offset().top}, 1000);
    }, function () {
        $(this).parents('.js-parents-toggle').find('.js-toggle-open').removeClass('close');
		$(this).parents('.js-parents-toggle').find('.js-toggle-close').removeClass('open');
        $(this).find('.button-slide-down__name').text("Раскрыть");
        $(this).removeClass('active');
		$('html, body').animate({scrollTop: $('.js-scroll').offset().top}, 1000);
    });
    $('.tel_mask').mask('+7 (999) 999-99-99');
    $('.js-link-nav').click(function () {
        $(this).parent().siblings().removeClass('active');
        var id = $(this).attr('href');
        $('header').find('.js-open-nav-block').not(id).hide();
        $(id).fadeToggle(0);
        $(this).parent().toggleClass('active');
        return false;
    });
    $('.js-close-open-nav').click(function () {
        $('.js-open-nav-block').fadeOut(200);
        $('.js-link-nav').parent().removeClass('active');
        return false;
    });
    if ($('.fancybox').length) {
        $('.fancybox').fancybox();
    };
    $('.fancybox2').fancybox({
        wrapCSS : 'wrap-fancy-window'
      });
    if ($('.fancybox-media').length) {
        $('.fancybox-media').attr('rel', 'media-gallery').fancybox({
            openEffect: 'none',
            closeEffect: 'none',
            prevEffect: 'none',
            nextEffect: 'none',
            arrows: false,
            helpers: {
                media: {},
                buttons: {}
            }
        });
    };
    $(".js-sign-up-button").click(function(a){
        a.preventDefault();
        $(this).parent('').parent('form').toggleClass("box-form-hide");
        $(this).parent('').parent('form').siblings("form").removeClass("box-form-hide");
    });
    $('.js-scroll-top').click(function() {
        $('html, body').animate({scrollTop: 0},500);
        return false;
      });
    $(document).click(function (e) {
        if ($(e.target).parents().filter('.js-parent-open-drop:visible').length != 1) {
            $('.dropdown-pane').removeClass('is-open');
            $(".js-open-drop").removeClass('hover');
        }
    });
    if ($('.js-styled').length) {
        $('.js-styled').styler();
    };
	if ($('.gallery-product-compare').length) {
		$('.gallery-product-compare').slick({
			infinite: true,
			speed: 300,
			adaptiveHeight: true,
			autoplay: false,
			autoplaySpeed: 2000,
			slidesToShow: 6,
			responsive: [{
				breakpoint: 1200,
				settings: {
					slidesToShow: 5,
					slidesToScroll: 1
				}
			}, {
				breakpoint: 1150,
				settings: {
					slidesToShow: 4,
					slidesToScroll: 1
				}
			}, {
				breakpoint: 950,
				settings: {
					slidesToShow: 3,
					slidesToScroll: 1
				}
			}, {
				breakpoint: 800,
				settings: {
					slidesToShow: 2,
					slidesToScroll: 1
				}
			}, {
				breakpoint: 650,
				settings: {
					slidesToShow: 1,
					slidesToScroll: 1
				}
			}]
		});
	};
    $('.button-minus').click(function () {
        var $input = $(this).parent().find('input');
        var count = parseInt($input.val()) - 1;
        count = count < 1 ? 1 : count;
        $input.val(count);
        $input.change();
        return false;
    });
    $('.button-plus').click(function () {
        var $input = $(this).parent().find('input');
        var count = parseInt($input.val()) + 1;
        count = count > ($input.attr("maxlength")) ? ($input.attr("maxlength")) : count;
        $input.val(count);
        $input.change();
        return false;
    });
	if ($('#slider_price').length) {
    	$("#slider_price").slider({
			min: 5000,
			max: 200000,
			step: 1,
			values: [25500, 180000],
			range: true,
			stop: function (event, ui) {
				jQuery("input#min_cost_1").val(jQuery("#slider_price").slider("values", 0));
				jQuery("input#max_cost_1").val(jQuery("#slider_price").slider("values", 1));
			},
			slide: function (event, ui) {
				jQuery("input#min_cost_1").val(jQuery("#slider_price").slider("values", 0));
				jQuery("input#max_cost_1").val(jQuery("#slider_price").slider("values", 1));
			}
		});
	};
	if ($('#slider_number').length) {
		$("#slider_number").slider({
			min: 10,
			max: 350,
			step: 1,
			values: [50, 250],
			range: true,
			stop: function (event, ui) {
				jQuery("input#min_cost_2").val(jQuery("#slider_number").slider("values", 0));
				jQuery("input#max_cost_2").val(jQuery("#slider_number").slider("values", 1));
			},
			slide: function (event, ui) {
				jQuery("input#min_cost_2").val(jQuery("#slider_number").slider("values", 0));
				jQuery("input#max_cost_2").val(jQuery("#slider_number").slider("values", 1));
			}
		});
	};
    $(".js-show-more-2").toggle(function () {
        $(this).parents('.js-parents-toggle').find('.js-toggle').slideDown();
        $(this).text("Скрыть");
        $(this).addClass('active');
    }, function () {
        $(this).parents('.js-parents-toggle').find('.js-toggle').slideUp();
        $(this).text("Ещё бренды");
        $(this).removeClass('active');
    });
    $('.box-filter__title').click(function () {
        $(this).parents('.box-filter__section').find('.box-filter__cont').fadeToggle(0);
        $(this).parents('.box-filter__section').toggleClass('box-filter__section_close');
        return false;
    });
    $('.box-price-list__title').click(function () {
        $(this).parents('.box-price-list__bottom').toggleClass('box-price-list__section_close');
        $(this).parents('.box-price-list__top').toggleClass('box-price-list__section_close');
        return false;
    });
    $('.js-horizontal-scroll').mCustomScrollbar({
        axis: "x",
        theme: "dark-thin",
        autoExpandScrollbar: true,
        advanced: {
            autoExpandHorizontalScroll: true
        }
    });
    $('.button-show-more').click(function () {
        $(this).fadeOut(0);
        $(this).parent().find('.loader-block').fadeIn(0);
        setTimeout(function () {
            $('.button-show-more').fadeIn(0);
            $('.loader-block').fadeOut(0);
            $('.hide-item').slideDown(100);
        }, 3000);
        return false;
    });
    $('.box-search__input').on("focus", function(){
        $(".box-search__button").removeClass("icon_search");
    });
    $('.box-search__input').on("focusout", function(){
        $(".box-search__button span").removeClass("show-ib");
        $(".box-search__button").addClass("icon_search");
    });
    $('.box-search__input').keyup(function(){
        $(".box-search__button span").addClass("show-ib");
    });
    $(".js-link-open-help").click(function () {
        $('.box-question').removeClass('open');
        $('.js-open-on-click').removeClass('open');
        $(this).parents('.box-question').addClass('open');
        $(this).parents('.js-parent-help').find('.js-open-on-click').toggleClass('open');
        return false;
    });
    $(document).click(function (e) {
        if ($(e.target).parents().filter('.js-open-on-click').length != 1) {
            $('.js-open-on-click').removeClass('open');
        }
    });
    if ($('#zoom_03f').length) {
        $("#zoom_03f").elevateZoom({
            gallery: 'gallery_01f',
            cursor: 'pointer',
            galleryActiveClass: "active"
        });
        $("#zoom_03f").bind("click", function (e) {
            var ez = $('#zoom_03f').data('elevateZoom');
            ez.closeAll();
            $.fancybox(ez.getGalleryList());
            return false;
        });
    };
    $(".js-color-tooltip").click(function () {
        $('.tooltip').addClass('active');
        return false;
    });
    $(document).click(function (e) {
        if ($(e.target).parents().filter('.tooltip').length != 1) {
            $('.tooltip').removeClass('active');
        }
    });
	$(".list-checkbox__item label").click(function () {
		  var offsetTop = $(this).offset();
		  var offsetTopList = $('.box-filter').offset();
        $('.help-number').css({'top':offsetTop.top-offsetTopList.top-6});       
    });
	$(".jq-checkbox").click(function () {
		  var offsetTop = $(this).offset();
		  var offsetTopList = $('.box-filter').offset();
        $('.help-number').css({'top':offsetTop.top-offsetTopList.top-6});        
    });
    $(".jq-radio").click(function () {
		  var offsetTop = $(this).offset();
		  var offsetTopList = $('.box-filter').offset();
        $('.help-number').css({'top':offsetTop.top-offsetTopList.top-6});        
    });
    $(".filter-toggle").click(function () {
        $('.column-filter').toggleClass('show-filter-mob');
        return false;
    });
	
	$('.up-btn-block').click(function() {
		$('html, body').animate({scrollTop: 0}, 500);
		return false;
	});
	$(window).scroll(function() {
		var scroll_num = $(window).scrollTop();
		if (scroll_num > 10) {				
			$(".up-btn-block").fadeIn();					
		} else{
			$(".up-btn-block").fadeOut();
		}
	});


	$(".js-btn-close").on("click", function(){
		$(".fancybox-close").click();
	});
	
 	
    $(".link-tab-mobile").click(function () {
        $(this).parents('.tabs-content').find('.tabs-panel').removeClass('is-active-mobile');
        $(this).parents('.tabs-content').find('.link-tab-mobile').removeClass('active');
        $(this).addClass('active');
        $(this).next().addClass('is-active-mobile');
        var target_scroll = $(this).attr('href');
        $('html, body').animate({scrollTop: $(target_scroll).offset().top-57}, 1000);
    });
    
    $('.box-search__input').on("focus", function(){
        $(".drop-search").slideDown();
    });
    $('.box-search__input').on("focusout", function(){
        $(".drop-search").slideUp();
    });
    
    $(".js-scrool-to").click(function () {
        var target_scroll3 = $(this).attr('href');
        $('html, body').animate({scrollTop: $(target_scroll3).offset().top-50}, 1000);
    });
	
	$('.table-lk__description.with-open').click(function() {
		$(this).parents('.tr').toggleClass('open');
		return false;
	});
	
	//charts
    if($('.chart-area').length){	
		var pieOptions = {
		    segmentShowStroke : false,
			animationSteps: 60,
			animationEasing: "easeOutQuart",
			scaleShowLabels: true
		};
		// charts 1
		if($('#chart-area').length){	
		   var element_1= $('#chart-area');
		   var chart_1= document.getElementById("chart-area").getContext("2d");
		   var pieData = [
				{
					value : $(element_1).data('percent'),
					color : $(element_1).data('color')
				},
				{
					value : $(element_1).data('percent2'),
					color : $(element_1).data('color2')
				},
			   	{
					value : $(element_1).data('percent3'),
					color : $(element_1).data('color3')
				},
			   	{
					value : $(element_1).data('percent4'),
					color : $(element_1).data('color4')
				},
			   	{
					value : $(element_1).data('percent5'),
					color : $(element_1).data('color5')
				},
			   	{
					value : $(element_1).data('percent6'),
					color : $(element_1).data('color6')
				},
			   	{
					value : $(element_1).data('percent7'),
					color : $(element_1).data('color7')
				},
				{
					value: 100 - $(element_1).data('percent') - $(element_1).data('percent2') - $(element_1).data('percent3') - $(element_1).data('percent4') - $(element_1).data('percent5') - $(element_1).data('percent6') - $(element_1).data('percent7'),
					color:"#69aa80"
				},   
			];
			new Chart(chart_1).Pie(pieData, pieOptions);
		};
		// charts 1
		if($('#chart-area').length){	
		   var element_1= $('#chart-area');
		   var chart_1= document.getElementById("chart-area").getContext("2d");
		   var pieData = [
				{
					value : $(element_1).data('percent'),
					color : $(element_1).data('color')
				},
				{
					value : $(element_1).data('percent2'),
					color : $(element_1).data('color2')
				},
			   	{
					value : $(element_1).data('percent3'),
					color : $(element_1).data('color3')
				},
			   	{
					value : $(element_1).data('percent4'),
					color : $(element_1).data('color4')
				},
			   	{
					value : $(element_1).data('percent5'),
					color : $(element_1).data('color5')
				},
			   	{
					value : $(element_1).data('percent6'),
					color : $(element_1).data('color6')
				},
			   	{
					value : $(element_1).data('percent7'),
					color : $(element_1).data('color7')
				},
				{
					value: 100 - $(element_1).data('percent') - $(element_1).data('percent2') - $(element_1).data('percent3') - $(element_1).data('percent4') - $(element_1).data('percent5') - $(element_1).data('percent6') - $(element_1).data('percent7'),
					color:"#69aa80"
				},   
			];
			new Chart(chart_1).Pie(pieData, pieOptions);
		};
		// charts 2
		if($('#chart-area2').length){	
		   var element_1= $('#chart-area2');
		   var chart_1= document.getElementById("chart-area2").getContext("2d");
		   var pieData = [
				{
					value : $(element_1).data('percent'),
					color : $(element_1).data('color')
				},
				{
					value : $(element_1).data('percent2'),
					color : $(element_1).data('color2')
				},
			   	{
					value : $(element_1).data('percent3'),
					color : $(element_1).data('color3')
				},
			   	{
					value : $(element_1).data('percent4'),
					color : $(element_1).data('color4')
				},
			   	{
					value : $(element_1).data('percent5'),
					color : $(element_1).data('color5')
				},
			   	{
					value : $(element_1).data('percent6'),
					color : $(element_1).data('color6')
				},
			   	{
					value : $(element_1).data('percent7'),
					color : $(element_1).data('color7')
				},
				{
					value: 100 - $(element_1).data('percent') - $(element_1).data('percent2') - $(element_1).data('percent3') - $(element_1).data('percent4') - $(element_1).data('percent5') - $(element_1).data('percent6') - $(element_1).data('percent7'),
					color:"#69aa80"
				},   
			];
			new Chart(chart_1).Pie(pieData, pieOptions);
		};
		// charts 3
		if($('#chart-area3').length){	
		   var element_1= $('#chart-area3');
		   var chart_1= document.getElementById("chart-area3").getContext("2d");
		   var pieData = [
				{
					value : $(element_1).data('percent'),
					color : $(element_1).data('color')
				},
				{
					value : $(element_1).data('percent2'),
					color : $(element_1).data('color2')
				},
			   	{
					value : $(element_1).data('percent3'),
					color : $(element_1).data('color3')
				},
			   	{
					value : $(element_1).data('percent4'),
					color : $(element_1).data('color4')
				},
			   	{
					value : $(element_1).data('percent5'),
					color : $(element_1).data('color5')
				},
			   	{
					value : $(element_1).data('percent6'),
					color : $(element_1).data('color6')
				},
			   	{
					value : $(element_1).data('percent7'),
					color : $(element_1).data('color7')
				},
				{
					value: 100 - $(element_1).data('percent') - $(element_1).data('percent2') - $(element_1).data('percent3') - $(element_1).data('percent4') - $(element_1).data('percent5') - $(element_1).data('percent6') - $(element_1).data('percent7'),
					color:"#69aa80"
				},   
			];
			new Chart(chart_1).Pie(pieData, pieOptions);
		};
		// charts 4
		if($('#chart-area4').length){	
		   var element_1= $('#chart-area4');
		   var chart_1= document.getElementById("chart-area4").getContext("2d");
		   var pieData = [
				{
					value : $(element_1).data('percent'),
					color : $(element_1).data('color')
				},
				{
					value : $(element_1).data('percent2'),
					color : $(element_1).data('color2')
				},
			   	{
					value : $(element_1).data('percent3'),
					color : $(element_1).data('color3')
				},
			   	{
					value : $(element_1).data('percent4'),
					color : $(element_1).data('color4')
				},
			   	{
					value : $(element_1).data('percent5'),
					color : $(element_1).data('color5')
				},
			   	{
					value : $(element_1).data('percent6'),
					color : $(element_1).data('color6')
				},
			   	{
					value : $(element_1).data('percent7'),
					color : $(element_1).data('color7')
				},
				{
					value: 100 - $(element_1).data('percent') - $(element_1).data('percent2') - $(element_1).data('percent3') - $(element_1).data('percent4') - $(element_1).data('percent5') - $(element_1).data('percent6') - $(element_1).data('percent7'),
					color:"#ed535b"
				},   
			];
			new Chart(chart_1).Pie(pieData, pieOptions);
		};
	};
	if($(".star").length){
		$('input.star').rating();
	};
	if($(".wow").length){
		$('input.wow').rating();
	};
	
	if ($('.mini-img-card').length) {
		$('.mini-img-card').slick({
			slidesToShow: 1,
			slidesToScroll: 1,
			infinite: true,
			dots: false,
			arrows: true,
			responsive: [{
				breakpoint: 2000,
				settings: "unslick"
			}, {
				breakpoint: 500,
				settings: "slick"
			}]
		});
	};
	
	
	$('.list-sort__link').click(function () {
        $(this).parent().siblings().removeClass('active');
        $(this).parent().addClass('active');
    });
	$('.list-sort__item.active .list-sort__link').live('click',function() {
        $(this).parent().toggleClass('up');		
    });
	
    
});


$(window).scroll(function() {		
        if($('.js-parent-ofset').length){ 
			var offset = $('.start-offset').offset().top;
			var offsetEnd = $('.end-offset').offset().top;
			var infoPriceHeight = $('.card-product__info-price-cont').height();
			var heightScroolTable = $('.js-parent-ofset').height();
			var minHeightTableForScroll = infoPriceHeight + 200;
            if ($(window).scrollTop() > offset && $(window).scrollTop() < offsetEnd - infoPriceHeight - 56 && heightScroolTable > minHeightTableForScroll ) {
               $('.card-product__info-price-cont').addClass("fixed");
            } else{
               $('.card-product__info-price-cont').removeClass("fixed") 
            }
        }
});
var handler2 = function () {
    
	var height_footer = $('footer').height();
    var hh = $(window).height();
    $('.content').css({
        'padding-bottom': height_footer + 37
    });
    var hh_img_map = $('.box-enhanced-contacts__photo').height();
    $('.box-enhanced-contacts__map').css({
        'height': hh_img_map
    });
    var ww = $(window).width();
    if (ww < 992) {
        $('.js-vertical-scroll2').mCustomScrollbar();
    };
    if (ww > 991) {
        var exampleOptions = {
            speed: 'fast'
        }
        var example = $('#example').superfish(exampleOptions);
        $('.destroy').on('click', function () {
            example.superfish('destroy');
        });
        $('.init').on('click', function () {
            example.superfish(exampleOptions);
        });
        $('.open').on('click', function () {
            example.children('li:first').superfish('show');
        });
        $('.close').on('click', function () {
            example.children('li:first').superfish('hide');
        });
    } else {
        $('.menu__item_with-drop .menu__link').click(function () {
            $(this).parent().siblings().removeClass('active');
            $(this).parent().siblings().find('.open-block-menu').slideUp(0);
            $(this).parent().find('.open-block-menu').slideToggle(0);
            $(this).parent().toggleClass('active');
            $('.js-vertical-scroll2').mCustomScrollbar("update");
            return false;
        });
    };
    
    var hh_min = $('.js-hh-min-example').height();
    $('.js-hh-min').css({
        'min-height': hh_min
    });
    
    
    $(window).scroll(function() {  
        if ($(window).scrollTop() > 50) {
            $('.link-filter').addClass("fixed");
        } else{
            $('.link-filter').removeClass("fixed");
        };

    });

    $(window).load(function() {  
        if ($(window).scrollTop() >150) {
            $('.link-filter').addClass("fixed");
        } else{
            $('.link-filter').removeClass("fixed");
        }
    });
    
    if($(".text-error__arrow").length){
		var offset_search = $('.box-search').offset();
		var offset_arrow = $('.text-error__text-border').offset();
		$('.text-error__arrow').css({'height':offset_arrow.top - offset_search.top -20});
	};  		
  	
		
	
}
$(window).bind('load', handler2);
$(window).bind('resize', handler2);


$(function () {	
	if($('.box-fix-scroll').length){
		$(".box-fix-scroll").mCustomScrollbar({
			horizontalScroll:true,
			scrollButtons:{enable:false},
			mouseWheel:{ enable: false },
			advanced:{updateOnContentResize:true},
			advanced:{updateOnBrowserResize:true}
		});
	};
	//fixed scroll
	
	if($('.box-fix-scroll').length){	
		var windowHeight = $(window).height();
		var offset_top = $(this).find('.box-fix-scroll').offset().top;
		var height_table = $('.height-table').height();
		$(window).scroll(function() {		
			if ($(window).scrollTop()+windowHeight > offset_top+height_table){
				$('.box-fix-scroll').addClass("no-fixed");
			} else{
				$('.box-fix-scroll').removeClass("no-fixed");
			};
			if (offset_top > windowHeight+$(window).scrollTop()){
				$('.box-fix-scroll').addClass("no-fixed_top");
			} else{
				$('.box-fix-scroll').removeClass("no-fixed_top");
			}
		});
	};
});



$(function () {
 /*****Brend List*****/
	
	var is_animate = false;/*!!!!!!!!!!!!!!!!!!!!!!!!!!*/

    $(".bl_all").click(function(){
	
        if($(this).hasClass('bl_active')) return;
        if (is_animate)/*!!!!!!!!!!!!!!!!!!!!!!!!!!*/
            return false;
        is_animate = true;/*!!!!!!!!!!!!!!!!!!!!!!!!!!*/

        $(".bl_active").removeClass("bl_active");
        $(this).addClass("bl_active");
		
		$(".bbb_active").removeClass("bbb_active");
        $(".bb_active").fadeOut("slow",function(){
            $(".bb_active").hide();
            $(".bb_active").removeClass("bb_active");
        });
		
		$(".bb_all").addClass("bbb_active");
        $(".bb_all").fadeIn("slow",function(){
            $(".bb_all").addClass("bb_active");
            is_animate = false;/*!!!!!!!!!!!!!!!!!!!!!!!!!!*/
        });
		if (!$(".brend_cont").hasClass('showed'))
			$(".show_brends").click();
		var bHeight=$('.brend_block.bb_all').outerHeight();
        //$(".brend_block_pusher").animate({'height': $(".bb_all").data("height")},300);
        $(".brend_cont").animate({height: bHeight});
        return false;
    });

    $(".bl_popular").unbind('click');
    $(".bl_popular").bind("click", function(){
		
        if($(this).hasClass('bl_active')) return;

        if (is_animate)/*!!!!!!!!!!!!!!!!!!!!!!!!!!*/
            return false;
        is_animate = true;/*!!!!!!!!!!!!!!!!!!!!!!!!!!*/
		
		$(".bbb_active").removeClass("bbb_active");
        $(".bl_active").removeClass("bl_active");
        $(this).addClass("bl_active");
        $(".bb_active").fadeOut("slow",function(){
            $(".bb_active").hide();
            $(".bb_active").removeClass("bb_active");
        });
		
		$(".bb_popular").addClass("bbb_active");
        $(".bb_popular").fadeIn("slow",function(){
            $(".bb_popular").addClass("bb_active");
            mixTags(true);
            is_animate = false;/*!!!!!!!!!!!!!!!!!!!!!!!!!!*/
        });
		if (!$(".brend_cont").hasClass('showed'))
                $(".show_brends").click();
		var bHeight=$('.brend_block.bb_popular').outerHeight();

        //$(".brend_block_pusher").animate({'height': $(".bb_popular").data("height")},300);
        $(".brend_cont").animate({height: bHeight});
        //setTimeout(function(){$(".brend_cont").animate({height: bHeight});}, 2000);
        return false;
    });

    $(".bl_category").unbind('click');
    $(".bl_category").bind("click", function(){
	
        if($(this).hasClass('bl_active')) return;

        if (is_animate)/*!!!!!!!!!!!!!!!!!!!!!!!!!!*/
            return false;
        is_animate = true;/*!!!!!!!!!!!!!!!!!!!!!!!!!!*/
		
		$(".bbb_active").removeClass("bbb_active");
        $(".bl_active").removeClass("bl_active");
        $(this).addClass("bl_active");
        $(".bb_active").fadeOut("slow",function(){
            $(".bb_active").hide();
            $(".bb_active").removeClass("bb_active");
        });
		
		$(".bb_category").addClass("bbb_active");
		$(".bb_category").fadeIn("slow",function(){
            $(".bb_category").addClass("bb_active");
            mixTags2(true);
            is_animate = false;/*!!!!!!!!!!!!!!!!!!!!!!!!!!*/
        });
		if (!$(".brend_cont").hasClass('showed'))
			$(".show_brends").click();
        
		var bHeight=$('.brend_block.bb_category').outerHeight();
       // $(".brend_block_pusher").animate({'height': $(".bb_category").data("height")},300);
        $(".brend_cont").animate({height: bHeight});
        //setTimeout(function(){$(".brend_cont").animate({height: bHeight});}, 2000);
        return false;
    });

    $(".hide_brends").unbind('click');
    $(".hide_brends").bind("click", function(){
		$('.brend_cont').removeClass('showed');
        $(".brend_cont").animate({
            height: $(".brend_icon_block").outerHeight(true),
            opacity: 0
        }, {queue:false, duration:1000, complete: function() {
            $(".brend_icon_block").css('position','relative');
            $(".brend_cont").css('position','fixed');
            //$(".brend_cont").hide();
            $(".hide_brends").removeClass("active");
        }});
        $(".brend_icon_block").show();
        $(".brend_icon_block").animate({
            opacity: 1
        }, {queue:true, duration:1000, complete: function() {
            $(".show_brends").addClass("active");
        }});
        return false;
    });

    $(".show_brends").unbind('click');
    $(".show_brends").bind("click", function(){
		$('.brend_cont').addClass('showed');
		var bHeight=$('.brend_block.bbb_active').outerHeight(true);
		if(bHeight==null){
			bHeight=$('.brend_block.bb_active').outerHeight(true);
		}
        var autoHeight = $(".brend_cont").css('height', 'auto').outerHeight(true);
        $(".brend_cont").height($(".brend_icon_block").outerHeight(true)+100); //Why exactly 100? I don't really know...
        $(".brend_icon_block").css('position','absolute');
        $(".brend_cont").show();
        $(".brend_cont").css('position','relative');
		if(bHeight>0){

			$(".brend_cont").animate({
				height: bHeight,
				opacity: 1
			}, {queue:false, duration:1000, complete: function() {
				$(".brend_cont").css('height', bHeight);
				$(".hide_brends").addClass("active");
			}});
		}
        $(".brend_icon_block").animate({
            opacity: 0
        }, {queue:true, duration:1000, complete: function() {
            $(".brend_icon_block").hide();
            $(".show_brends").removeClass("active");
        }});
        if ($(".bb_popular").hasClass("bb_active")){
            mixTags(true);
        }
        return false;
    });


    /*$('.country_balun .flag a').mouseover(function(){
     $('.country_bubble').css({'visibility':'hidden'});
     $(this).parent().next().css({'visibility':'visible'});
     });*/



    $('.descr_mark').each(function(){
        var cow = ($(this).find('.bl_link').size())*178;
        $(this).css({'width':cow+'px'});
    });
	
	
	
});


/*****TagsCloud Mix******/
var tagsAlreadyMixed = false;
function mixTags(realRun) {
    realRun = realRun || false;

    if (tagsAlreadyMixed || realRun == false)
        return;

    var hb = $(".tagscloud").height();
    var wb = $(".tagscloud").width();


    //$(".tagscloud a").css('left',-9999);

    var arNotPlaced = [];
    var arPlaced = [];
    $(".tagscloud a").each(function(q) {
        var pos = $(this).position();
        var item = {'el': $(this), 'width': $(this).outerWidth(), 'height': $(this).outerHeight(), 'left': pos.left, 'top': pos.top};
        arNotPlaced.push(item);
    });
    var infodiv = $(".tagscloud div:first");

    var error = 0;
    var errorcycle = 0;
    do {
        for (var q = 0; q < arNotPlaced.length; q++) {
            var ws = arNotPlaced[q].width;
            var hs = arNotPlaced[q].height;


            var cx = Math.floor(Math.random()*(wb-ws));
            var cy = Math.floor(Math.random()*(hb-hs));

            var oo = 0;
            var ok = false;
            while (!ok) {
                var out = true;
                for (var i = -oo; ((i <= oo)&&(!ok)); i++) {
                    if (((cy + i)<0)||((cy + i)>=hb))
                        continue;

                    for (var j = -oo; ((j <= oo)&&(!ok)); j++) {
                        if (((cx + j)<0)||((cx + j)>=wb))
                            continue;

                        out = false;
                        if ((Math.abs(i) == oo)||((Math.abs(j) == oo))) {
                            var x1 = cx + j;
                            var y1 = cy + i;
                            var x2 = x1 + ws;
                            var y2 = y1 + hs;
                            if ((x2 > wb)||(y2 > hb))
                                continue;
                            var ok2 = true;
                            for (var z = 0; z < arPlaced.length; z++) { //check for covering
                                var wa = arPlaced[z].width;
                                var ha = arPlaced[z].height;

                                var xa1 = arPlaced[z].left;
                                var ya1 = arPlaced[z].top;
                                var xa2 = xa1 + wa;
                                var ya2 = ya1 + ha;

                                //перекрывается с кем то
                                if ((((x1>=xa1)&&(x1<xa2))||((xa1>=x1)&&(xa1<x2)))&&(((y1>=ya1)&&(y1<ya2))||((ya1>=y1)&&(ya1<y2)))) {
                                    ok2 = false;
                                    break;
                                }
                            }
                            if (ok2) {
                                arNotPlaced[q].left = x1;
                                arNotPlaced[q].top = y1;
                                arPlaced.push(arNotPlaced[q]);
                                ok = true;
                            }
                        }
                    }
                }
                oo++;
                if (out) {
                    error++;
                    break;
                }
            }
        }
    } while ((error != 0)&&(errorcycle < 10));

    if (errorcycle < 10) {
        for (var z = 0; z < arPlaced.length; z++) {
            arPlaced[z].el.css('left',arPlaced[z].left);
            arPlaced[z].el.css('top',arPlaced[z].top);
        }
    }
    else {
        $(".tagscloud a").css('left','');
        $(".tagscloud a").css('position','relative');
    }

    tagsAlreadyMixed = true;
}

var tagsAlreadyMixed2 = false;
function mixTags2(realRun) {
    realRun = realRun || false;

    if (tagsAlreadyMixed2 || realRun == false)
        return;

    var hb = $(".tagscloud2").height();
    var wb = $(".tagscloud2").width();


    //$(".tagscloud a").css('left',-9999);

    var arNotPlaced = [];
    var arPlaced = [];
    $(".tagscloud2 a").each(function(q) {
        var pos = $(this).position();
        var item = {'el': $(this), 'width': $(this).outerWidth(), 'height': $(this).outerHeight(), 'left': pos.left, 'top': pos.top};
        arNotPlaced.push(item);
    });
    var infodiv = $(".tagscloud2 div:first");

    var error = 0;
    var errorcycle = 0;
    do {
        for (var q = 0; q < arNotPlaced.length; q++) {
            var ws = arNotPlaced[q].width;
            var hs = arNotPlaced[q].height;


            var cx = Math.floor(Math.random()*(wb-ws));
            var cy = Math.floor(Math.random()*(hb-hs));

            var oo = 0;
            var ok = false;
            while (!ok) {
                var out = true;
                for (var i = -oo; ((i <= oo)&&(!ok)); i++) {
                    if (((cy + i)<0)||((cy + i)>=hb))
                        continue;

                    for (var j = -oo; ((j <= oo)&&(!ok)); j++) {
                        if (((cx + j)<0)||((cx + j)>=wb))
                            continue;

                        out = false;
                        if ((Math.abs(i) == oo)||((Math.abs(j) == oo))) {
                            var x1 = cx + j;
                            var y1 = cy + i;
                            var x2 = x1 + ws;
                            var y2 = y1 + hs;
                            if ((x2 > wb)||(y2 > hb))
                                continue;
                            var ok2 = true;
                            for (var z = 0; z < arPlaced.length; z++) { //check for covering
                                var wa = arPlaced[z].width;
                                var ha = arPlaced[z].height;

                                var xa1 = arPlaced[z].left;
                                var ya1 = arPlaced[z].top;
                                var xa2 = xa1 + wa;
                                var ya2 = ya1 + ha;

                                //перекрывается с кем то
                                if ((((x1>=xa1)&&(x1<xa2))||((xa1>=x1)&&(xa1<x2)))&&(((y1>=ya1)&&(y1<ya2))||((ya1>=y1)&&(ya1<y2)))) {
                                    ok2 = false;
                                    break;
                                }
                            }
                            if (ok2) {
                                arNotPlaced[q].left = x1;
                                arNotPlaced[q].top = y1;
                                arPlaced.push(arNotPlaced[q]);
                                ok = true;
                            }
                        }
                    }
                }
                oo++;
                if (out) {
                    error++;
                    break;
                }
            }
        }
    } while ((error != 0)&&(errorcycle < 10));

    if (errorcycle < 10) {
        for (var z = 0; z < arPlaced.length; z++) {
            arPlaced[z].el.css('left',arPlaced[z].left);
            arPlaced[z].el.css('top',arPlaced[z].top);
        }
    }
    else {
        $(".tagscloud2 a").css('left','');
        $(".tagscloud2 a").css('position','relative');
    }

    tagsAlreadyMixed2 = true;
}




// new function

var handler3 = function () {
    	
	// compare	
	var compLen = (".box-compare__bottom").length;
	if(compLen>0){	
		$(".list-characteristics_1 .list-characteristics__item").css("height","auto");
		for (var i=1; i<99; i++){
			var height1 = 0; 	
			$('.list-characteristics_1 .list-characteristics__item:nth-child('+i+')').each(function() {height1 = height1 > $(this).height() ? height1 : $(this).height();});	
			$('.list-characteristics_1 .list-characteristics__item:nth-child('+i+')').each(function() {$(this).css("height",height1+"px")});		
		}			
		setTimeout(function(){
			$(".list-characteristics_1 .list-characteristics__item").css("height","auto");
			for (var i=1; i<99; i++){
				var height1 = 0; 	
				$('.list-characteristics_1 .list-characteristics__item:nth-child('+i+')').each(function() {height1 = height1 > $(this).height() ? height1 : $(this).height();});	
				$('.list-characteristics_1 .list-characteristics__item:nth-child('+i+')').each(function() {$(this).css("height",height1+"px")});		
			}		
		}, 500);

		$(".list-characteristics_2 .list-characteristics__item").css("height","auto");
		for (var i=1; i<99; i++){
			var height2 = 0; 	
			$('.list-characteristics_2 .list-characteristics__item:nth-child('+i+')').each(function() {height2 = height2 > $(this).height() ? height2 : $(this).height();});	
			$('.list-characteristics_2 .list-characteristics__item:nth-child('+i+')').each(function() {$(this).css("height",height2+"px")});		
		}			
		setTimeout(function(){
			$(".list-characteristics_2 .list-characteristics__item").css("height","auto");
			for (var i=1; i<99; i++){
				var height2 = 0; 	
				$('.list-characteristics_2 .list-characteristics__item:nth-child('+i+')').each(function() {height2 = height2 > $(this).height() ? height2 : $(this).height();});	
				$('.list-characteristics_2 .list-characteristics__item:nth-child('+i+')').each(function() {$(this).css("height",height2+"px")});		
			}		
		}, 500);

		$(".list-characteristics_3 .list-characteristics__item").css("height","auto");
		for (var i=1; i<99; i++){
			var height3 = 0; 	
			$('.list-characteristics_3 .list-characteristics__item:nth-child('+i+')').each(function() {height3 = height3 > $(this).height() ? height3 : $(this).height();});	
			$('.list-characteristics_3 .list-characteristics__item:nth-child('+i+')').each(function() {$(this).css("height",height3+"px")});		
		}			
		setTimeout(function(){
			$(".list-characteristics_3 .list-characteristics__item").css("height","auto");
			for (var i=1; i<99; i++){
				var height3 = 0; 	
				$('.list-characteristics_3 .list-characteristics__item:nth-child('+i+')').each(function() {height3 = height3 > $(this).height() ? height3 : $(this).height();});	
				$('.list-characteristics_3 .list-characteristics__item:nth-child('+i+')').each(function() {$(this).css("height",height3+"px")});		
			}		
		}, 500);
	}
	// compare		
	
}
$(window).bind('load', handler3);
$(window).bind('resize', handler3);

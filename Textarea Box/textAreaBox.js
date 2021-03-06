
enyo.kind({
	name: "Textarea", 
	kind: enyo.Control,
	published: {
		hint: enyo._$L("Tap Here To Type"),
		value: "",
		tabIndex: "",
		// The max height we will allow the box to grow to
		maxTextHeight: "",
		// HTML5 'spellcheck' attribute
		spellcheck: true,
		// Maps to Mobile Safari 'autocorrect' attribute
		autocorrect: true,
		//* Possible settings: "num-lock", "caps-lock", "shift-lock", "shift-single", "num-single",
		autoKeyModifier: "",
		//* Possible settings: "sentence", "title", "lowercase" (actual attribute is cap +)
		autoCapitalize: "sentence",
		//* Set to true to enable auto-emoticons support
		autoEmoticons: false,
		//* Set to true to enable auto-linking support
		autoLinking: false,
		//* Set to false to disable automatic word completion
		autoWordComplete: true,
		//* Specifies the 'type' attribute on the input field.  On webOS, this modifies the virtual keyboard layout, supported values are "email" and "url".
		inputType: "",
		//* CSS class to apply to the inner input control
		inputClassName: "",
		//* CSS class to apply on focus
		focusClassName: "enyo-input-focus",
		//* CSS class to apply inner controls to control spacing
		spacingClassName: "enyo-input-spacing",
		//* Set to true to make the input look focused when it's not.
		alwaysLooksFocused: false,
		/**
		The selection property is an object describing selected text. The start and end properties
		specify the zero-based starting and ending indexes of the selection.
		For example, if an input value is "Value"
		and getSelection returns {start: 1, end: 3} then "al" is selected. To select "alu," call:

			this.$.input.setSelection({start: 1, end: 4});
		*/
		selection: null,
		disabled: false,
		/**
		Set to true to fire the onchange event as well as the oninput event
		whenever the input content is changed.
		*/
		changeOnInput: false,
		/**
		Set to the number of milliseconds to delay the input event when a key is pressed.
		If another key is pressed within the delay interval, the input will be postponed
		and fired once only after the delay has elapsed without a key being pressed.
		*/
		keypressInputDelay: 0,
		//* Set to false to avoid any default styling from being applied
		styled: true,
		//* Set to true to select all text when the input gains focus
		selectAllOnFocus: false
	},
	events: {
		onfocus: "",
		onblur: "",
		onchange: "",
		oninput: "",
		onmousedown: "",
		onmouseup: "",
		//* The onkeypress event can be used to filter out disallowed characters.
		onkeypress: ""
	},
	className: "enyo-input",
	//* @protected
	chrome: [
		{name: "input", flex: 1, kind: "BasicTextarea", className: "enyo-input-input"}
	],
	clientChrome: [
		{name: "client", kind: "HFlexBox", align: "center"}
	],
	create: function() {
		this.inherited(arguments);
		this.updateSpacingControl();
		this.disabledChanged();
		this.inputTypeChanged();
		this.tabIndexChanged();
		this.valueChanged();
		this.hintChanged();
		this.alwaysLooksFocusedChanged();
		this.inputClassNameChanged();
		this.styledChanged();
		this.applySmartTextOptions();
		
		if(this.maxTextHeight)
		{
			this.$.input.maxTextHeight = this.maxTextHeight.substr(0, this.maxTextHeight.length-2); //send to basicTextArea and strip "px" from it
		}
	},
	destroy: function() {
		this.stopInputDelayJob();
		this.inherited(arguments);
	},
	addControl: function(inControl) {
		if (!inControl.isChrome && !this.$.client) {
			this.createChrome(this.clientChrome);
			this.$.input.setParent(this.$.client);
			this.updateSpacingControl();
		}
		this.inherited(arguments);
	},
	selectAllHandler: function() {
		document.execCommand("selectAll");
	},
	cutHandler: function() {
		document.execCommand("cut");
	},
	copyHandler: function() {
		document.execCommand("copy");
	},
	pasteHandler: function() {
		if (PalmSystem && PalmSystem.paste) {
			PalmSystem.paste();
		}
	},
	mousedownHandler: function(inSender, inEvent) {
		var r = this.doMousedown(inEvent);
		this.chromeMousedown = (inEvent.dispatchTarget != this.$.input) ? inEvent : null;
		if (this.chromeMousedown) {
			this.handleChromeMousedown(inEvent);
		}
		return r;
	},
	handleChromeMousedown: function(inEvent) {
		// FIXME: when clicking chrome, always prevent default so that chrome can never be focused.
		// Do this to prevent virtual keyboard from toggling briefly (because focusAtPoint api is asynchronous).
		// Because of this track cancelling of the mousedown chrome event specially.
		inEvent.chromeEventPrevented = inEvent.prevented;
		inEvent.preventDefault();
		inEvent.preventDefault = function() {
			inEvent.chromeEventPrevented = true;
		}
	},
	focusHandler: function(inSender, inEvent) {
		if (this.styled && !this.alwaysLooksFocused) {
			this.addClass(this.focusClassName);
		}
		if (this.selectAllOnFocus) {
			this.forceSelect();
		}
		return this.doFocus(inEvent);
	},
	mouseupHandler: function(inSender, inEvent) {
		// force input to be focused when: there's a mousedown on chrome that's not cancelled,
		// there's been no drag, and not disabled
		if (this.chromeMousedown && !this.disabled && !inEvent.didDrag
			&& !this.chromeMousedown.chromeEventPrevented) {
			this.forceFocus(null, true);
		}
		return this.doMouseup(inEvent);
	},
	blurHandler: function(inSender, inEvent) {
		if (!this.alwaysLooksFocused) {
			this.removeClass(this.focusClassName);
		}
		if (this.selectAllOnFocus) {
			document.execCommand("Unselect");
		}
		return this.doBlur(inEvent);
	},
	clickHandler: function(inSender, inEvent) {
		// note: follow webkit behavior to not send clicks on input elements
		// this is done automatically for the input node; enforcing here to catch
		// any chrome around the input.
		return this.disabled ? true : this.doClick(inEvent);
	},
	rendered: function() {
		this.inherited(arguments);
		this.selectionChanged();
	},
	inputClassNameChanged: function() {
		this.$.input.addClass(this.inputClassName);
	},
	alwaysLooksFocusedChanged: function() {
		if (this.alwaysLooksFocused && this.styled) {
			this.addClass(this.focusClassName);
		}
	},
	inputTypeChanged: function() {
		this.$.input.domAttributes.type = this.inputType;
		if (this.hasNode()) {
			this.$.input.render();
		}
	},
	valueChanged: function() {
		this.$.input.setValue(this.value);
	},
	getDomValue: function() {
		return this.$.input.getDomValue();
	},
	getValue: function() {
		return this.$.input.getValue();
	},
	tabIndexChanged: function() {
		this.$.input.setTabIndex(this.tabIndex);
	},
	// dom event handler
	changeHandler: function(inSender, e) {
		if (!this.changeOnInput) {
			this.value = inSender.getValue();
			this.doChange(e, this.value);
		}
		return true;
	},
	inputHandler: function(inSender, e) {
		this.value = inSender.getValue();
		if (this.keypressInputDelay) {
			var fn = enyo.bind(this, "processInputEvent", e);
			enyo.job(this.id + "-inputDelay", fn, Number(this.keypressInputDelay));
		} else {
			this.processInputEvent(e);
		}
		return true;
	},
	processInputEvent: function(e) {
		this.doInput(e, this.value);
		if (this.changeOnInput) {
			this.doChange(e, this.value);
		}
	},
	keypressInputDelayChanged: function() {
		this.stopInputDelayJob();
	},
	stopInputDelayJob: function() {
		enyo.job.stop(this.id + "-inputDelay");
	},
	selectionChanged: function() {
		var n = this.$.input.hasNode();
		if (n && this.selection) {
			n.selectionStart = this.selection.start;
			n.selectionEnd = this.selection.end;
		}
	},
	getSelection: function() {
		var n = this.$.input.hasNode();
		return n ? {start: n.selectionStart, end: n.selectionEnd} : {start: 0, end: 0};
	},
	disabledChanged: function() {
		this.$.input.setDisabled(this.disabled);
	},
	hintChanged: function() {
		this.$.input.setPlaceholder(this.hint);
	},
	// FIXME: Smart text replace options (could be factored out)
	autoKeyModifierChanged: function() {
		this.$.input.setAttribute("x-palm-text-entry", this.autoKeyModifier ? this.autoKeyModifier : null);
	},
	autoCapitalizeChanged: function() {
		if (this.autoCapitalize === "lowercase") {
			this.$.input.setAttribute("x-palm-disable-auto-cap", "true");
			this.$.input.setAttribute("x-palm-title-cap", null);
		} else {
			this.$.input.setAttribute("x-palm-disable-auto-cap", null);
			this.$.input.setAttribute("x-palm-title-cap", (this.autoCapitalize === "title") ? true : null);
		}
	},
	autocorrectChanged: function() {
		// FIXME: our WebKit implementation of 'autocorrect' and 'spellcheck' doesn't work for all 4 possible values
		this.$.input.setAttribute("autocorrect", this.autocorrect ? "on" : "off");
	},
	spellcheckChanged: function() {
		// FIXME: our WebKit implementation of 'autocorrect' and 'spellcheck' doesn't work for all 4 possible values
		this.$.input.setAttribute("spellcheck", !!this.spellcheck);
	},

	autoLinkingChanged: function() {
		this.$.input.setAttribute("x-palm-enable-linker", this.autoLinking ? this.autoLinking : null);
	},
	autoEmoticonsChanged: function() {
		this.$.input.setAttribute("x-palm-enable-emoticons", this.autoEmoticons ? this.autoEmoticons : null);
	},
	autoWordCompleteChanged: function() {
		this.$.input.setAttribute("x-palm-word-completions", this.autoWordComplete ? null : "disabled");
	},
	applySmartTextOptions: function() {
		this.spellcheckChanged();
		this.autoWordCompleteChanged();
		this.autocorrectChanged();
		this.autoLinkingChanged();
		this.autoEmoticonsChanged();
		this.autoCapitalizeChanged();
		this.autoKeyModifierChanged();
	},
	// control used to reclaim space, can be either input or client
	updateSpacingControl: function() {
		var c = this.$.client || this.$.input;
		if (c != this.spacingControl) {
			if (this.spacingControl) {
				this.spacingControl.removeClass(this.spacingClassName);
			}
			this.spacingControl = c;
		}
		this.spacingClassNameChanged();
	},
	spacingClassNameChanged: function(inOldValue) {
		if (this.spacingControl) {
			if (inOldValue) {
				this.spacingControl.removeClass(inOldValue);
			}
			this.spacingControl.addClass(this.spacingClassName);
		}
	},
	styledChanged: function(inOldValue) {
		this.addRemoveClass(this.ctor.prototype.className, this.styled);
		if (this.spacingControl) {
			this.spacingControl.addRemoveClass(this.spacingClassName, this.styled);
		}
	},
	//* @public
	isEmpty: function() {
		return this.$.input.isEmpty();
	},
	/**
		Forces this input to be focused.
	*/
	forceFocus: function(inCallback, inSync) {
		this.$.input.forceFocus(inCallback, inSync);
	},
	/**
		Force this input to be focused and set the keyboard to automatic mode.
	*/
	forceFocusEnableKeyboard: function() {
		this.forceFocus(enyo.bind(enyo, enyo.keyboard.setManualMode, false));
	},
	/**
		Forces this input to be blurred (lose focus).
	*/
	forceBlur: function(inCallback, inSync) {
		this.$.input.forceBlur(inCallback, inSync);
	},
	/**
		Force select all text in this input.
	*/
	forceSelect: function(inCallback, inSync) {
		this.$.input.forceSelect(inCallback, inSync);
	},
	/**
		Returns true if the input has keyboard focus.
	*/
	hasFocus: function() {
		return this.$.input.hasFocus();
	}
});







enyo.kind({
	name: "BasicTextarea",
	kind: enyo.Control,
	published: {
		value: "",
		maxTextHeight: "",
		disabled: false,
		readonly: false,
		placeholder: "",
		placeholderClassName: "",
		disabledClassName: "enyo-input-disabled",
		tabIndex: ""
	},
	events: {
		onfocus: "",
		onblur: "",
		onchange: "",
		onkeypress: "",
		onkeyup: ""
	},
	//* @protected
	nodeTag: "textarea",
	style: "font-family: Prelude, Prelude Medium, Segoe UI, Arial, Helvetica, Sans-Serif;", //--> Added this so we do not have to modify the textarea base css class
	// NOTE: only required in browser, overridden below
	requiresDomMousedown: true,
	create: function() {
		this.inherited(arguments);
		
		//==========================================================
		//--> For sizing:
		//		min-height - is obeyed
		//		height     - is transformed into min-height since this is a multi-line textbox and will grow in height, silly!
		//==========================================================
		if(this.parent.domStyles["min-height"]){
			this.applyStyle("min-height", this.parent.domStyles["min-height"]);
		}else if (this.parent.domStyles["height"]){
			this.applyStyle("min-height", this.parent.domStyles["height"]);
			this.parent.applyStyle("height", "");
		}
		
		if (window.PalmSystem) {
			this.requiresDomMousedown = true;
		}
		//==========================================================
		
		this.placeholder = this.placeholder || this.hint || "";
		enyo.mixin(this.domAttributes, {
			onfocus: enyo.bubbler,
			onblur: enyo.bubbler
		});
		this.disabledChanged();
		this.readonlyChanged();
		this.valueChanged();
		this.placeholderChanged();
	},
	keyupHandler: function(){
		//==========================================================
		//--> NOTE: keypress does not capture backspace, delete, or enter so use keyup
		//==========================================================
		this.resize();
	},
	resize: function(){
		//==========================================================
		//--> First clear the height to reset the scrollHeight
		//==========================================================
		this.applyStyle("height", "0px");
		
		//==========================================================
		//--> Now apply the scrollHeight to the current box
		//==========================================================
		if(this.maxTextHeight)
		{
			var h = ((this.node.scrollHeight > this.maxTextHeight) ? this.maxTextHeight:this.node.scrollHeight);
			
			this.applyStyle("height", h + "px");
		}
		else
		{
			this.applyStyle("height", this.node.scrollHeight + "px");
		}
	},
	getDomValue: function() {
		if (this.hasNode()) {
			return this.node.value;
		}
	},
	setDomValue: function(inValue) {
		this.setAttribute("value", inValue);
		// FIXME: it's not clear when we need to set .value vs. using setAttribute above
		if (this.hasNode()) {
			this.node.value = inValue;
		}
		if (!this.isEmpty()) {
			this.addRemovePlaceholderClassName(false);
		}
	},
	mousedownHandler: function(inSender, inEvent) {
		if (this.disabled) {
			inEvent.preventDefault();
		}
		return this.fire("mousedown", inEvent);
	},
	changeHandler: function(inSender, inEvent) {
		// if we are re-rendered we won't show the proper value unless we capture it in domAttributes
		// we don't call setAttribute (or setDomValue) because of potential side-effects of altering the DOM
		this.domAttributes.value = this.getValue();
		//--> Resize for auto-growth:
		this.resize()
		// we have the option/responsibility to propagate this event to owner
		this.doChange(inEvent);
	},
	isEmpty: function() {
		return !this.getValue();
	},
	getValue: function() {
		if (this.hasNode()) {
			var v = this.getDomValue();
			if (enyo.isString(v)) {
				this.value = v;
			}
		}
		return this.value;
	},
	valueChanged: function() {
		this.setDomValue(this.value);
		//--> Resize for auto-growth:
		//this.resize()
	},
	disabledChanged: function() {
		// NOTE: standard disabled attribute prevents all mouse events;
		// this could be avoided by not using this attribute;
		// however, this would make dealing with focus tab order complex 
		// (e.g. keyboard next focuses control: it should
		// not focus, but next control after this one should)
		this.setAttribute("disabled", this.disabled ? "disabled" : null);
		this.addRemoveClass(this.disabledClassName, this.disabled);
	},
	readonlyChanged: function() {
		this.setAttribute("readonly", this.readonly ? "readonly" : null);
	},
	placeholderChanged: function() {
		this.setAttribute("placeholder", this.placeholder);
	},
	tabIndexChanged: function() {
		this.setAttribute("tabindex", this.tabIndex);
	},
	focusHandler: function(inSender, e) {
		this.didFocus = true;
		if (this.hasNode()) {
			if (this.isEmpty()) {
				this.updatePlaceholder(false);
			}
		}
		return this.disabled ? true : this.doFocus();
	},
	blurHandler: function(inSender, inEvent) {
		this.didFocus = false;
		if (this.isEmpty()) {
			this.updatePlaceholder(true);
		}
		return this.doBlur();
	},
	updatePlaceholder: function(inApplyPlaceholder) {
		this.addRemovePlaceholderClassName(inApplyPlaceholder);
	},
	addRemovePlaceholderClassName: function(inApplyPlaceholder) {
		this.addRemoveClass(this.placeholderClassName, inApplyPlaceholder);
	},
	//* @public
	/**
	Force the input to receive keyboard focus.
	*/
	forceFocus: function(inCallback, inSync) {
		// has to be async in many cases (when responding to dom events, in particular) or it just fails
		if (inSync) {
			this.applyFocus(inCallback);
		} else {
			enyo.asyncMethod(this, "applyFocus", inCallback);
		}
	},
	//* @protected
	applyFocus: function(inCallback) {
		if (this.hasNode()) {
			this.node.focus();
			if (inCallback) {
				inCallback();
			}
		}
	},
	//* @public
	/**
		Forces this input to be blurred (lose focus).
	*/
	forceBlur: function(inCallback, inSync) {
		if (inSync) {
			this.applyBlur(inCallback);
		} else {
			enyo.asyncMethod(this, "applyBlur", inCallback);
		}
	},
	//* @protected
	applyBlur: function(inCallback) {
		if (this.hasNode()) {
			this.node.blur();
			if (inCallback) {
				inCallback();
			}
		}
	},
	//* @public
	/**
		Force select all text in this input.
	*/
	forceSelect: function(inCallback, inSync) {
		if (inSync) {
			this.applySelect(inCallback);
		} else {
			enyo.asyncMethod(this, "applySelect", inCallback);
		}
	},
	//* @protected
	applySelect: function(inCallback) {
		if (this.hasNode()) {
			this.node.select();
			if (inCallback) {
				inCallback();
			}
		}
	},
	/**
		Returns true if the input has keyboard focus.
	*/
	hasFocus: function() {
		if (this.hasNode()) {
			return Boolean(this.node.parentNode.querySelector(this.nodeTag +":focus"));
		}
	}
});

// on devices with focusAtPoint api, do not need special mousedown handling.
enyo.requiresWindow(function() {
	//if (window.PalmSystem) {
		BasicTextarea.prototype.requiresDomMousedown = false;
	//}
});
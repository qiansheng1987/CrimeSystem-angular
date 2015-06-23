EzServerClient.DrawToolbar = EzServerClient.Toolbar.extend({

	statics: {
		TYPE: 'draw'
	},

	options: {
		polyline: {},
		polygon: {},
		rectangle: {},
		circle: {},
		marker: {}
	},

	initialize: function (options) {
		// Ensure that the options are merged correctly since EzServerClient.extend is only shallow
		for (var type in this.options) {
			if (this.options.hasOwnProperty(type)) {
				if (options[type]) {
					options[type] = EzServerClient.extend({}, this.options[type], options[type]);
				}
			}
		}

		this._toolbarClass = 'leaflet-draw-draw';
		EzServerClient.Toolbar.prototype.initialize.call(this, options);
	},

	getModeHandlers: function (map) {
		return [
			{
				enabled: this.options.polyline,
				handler: new EzServerClient.Draw.Polyline(map, this.options.polyline),
				title: EzServerClient.drawLocal.draw.toolbar.buttons.polyline
			},
			{
				enabled: this.options.polygon,
				handler: new EzServerClient.Draw.Polygon(map, this.options.polygon),
				title: EzServerClient.drawLocal.draw.toolbar.buttons.polygon
			},
			{
				enabled: this.options.rectangle,
				handler: new EzServerClient.Draw.Rectangle(map, this.options.rectangle),
				title: EzServerClient.drawLocal.draw.toolbar.buttons.rectangle
			},
			{
				enabled: this.options.circle,
				handler: new EzServerClient.Draw.Circle(map, this.options.circle),
				title: EzServerClient.drawLocal.draw.toolbar.buttons.circle
			},
			{
				enabled: this.options.marker,
				handler: new EzServerClient.Draw.Marker(map, this.options.marker),
				title: EzServerClient.drawLocal.draw.toolbar.buttons.marker
			}
		];
	},

	// Get the actions part of the toolbar
	getActions: function (handler) {
		return [
			{
				enabled: handler.deleteLastVertex,
				title: EzServerClient.drawLocal.draw.toolbar.undo.title,
				text: EzServerClient.drawLocal.draw.toolbar.undo.text,
				callback: handler.deleteLastVertex,
				context: handler
			},
			{
				title: EzServerClient.drawLocal.draw.toolbar.actions.title,
				text: EzServerClient.drawLocal.draw.toolbar.actions.text,
				callback: this.disable,
				context: this
			}
		];
	},

	setOptions: function (options) {
		EzServerClient.setOptions(this, options);

		for (var type in this._modes) {
			if (this._modes.hasOwnProperty(type) && options.hasOwnProperty(type)) {
				this._modes[type].handler.setOptions(options[type]);
			}
		}
	}
});

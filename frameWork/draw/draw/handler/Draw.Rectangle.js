EzServerClient.Draw.Rectangle = EzServerClient.Draw.SimpleShape.extend({
	statics: {
		TYPE: 'rectangle'
	},

	options: {
		shapeOptions: {
			stroke: true,
			color: '#f06eaa',
			weight: 4,
			opacity: 0.5,
			fill: true,
			fillColor: null, //same as color by default
			fillOpacity: 0.2,
			clickable: true
		},
		metric: true // Whether to use the metric meaurement system or imperial
	},

	initialize: function (map, options) {
		// Save the type so super can fire, need to do this as cannot do this.TYPE :(
		this.type = EzServerClient.Draw.Rectangle.TYPE;

		this._initialLabelText = EzServerClient.drawLocal.draw.handlers.rectangle.tooltip.start;

		EzServerClient.Draw.SimpleShape.prototype.initialize.call(this, map, options);
	},

	_drawShape: function (latlng) {
		if (!this._shape) {
			this._shape = new EzServerClient.Rectangle(new EzServerClient.LatLngBounds(this._startLatLng, latlng), this.options.shapeOptions);
			this._map.addLayer(this._shape);
		} else {
			this._shape.setBounds(new EzServerClient.LatLngBounds(this._startLatLng, latlng));
		}
	},

	_fireCreatedEvent: function () {
		var rectangle = new EzServerClient.Rectangle(this._shape.getBounds(), this.options.shapeOptions);
		EzServerClient.Draw.SimpleShape.prototype._fireCreatedEvent.call(this, rectangle);
	},

	_getTooltipText: function () {
		var tooltipText = EzServerClient.Draw.SimpleShape.prototype._getTooltipText.call(this),
			shape = this._shape,
			latLngs, area, subtext;

		if (shape) {
			latLngs = this._shape.getLatLngs();
			area = EzServerClient.GeometryUtil.geodesicArea(latLngs);
			subtext = EzServerClient.GeometryUtil.readableArea(area, this.options.metric);
		}

		return {
			text: tooltipText.text,
			subtext: subtext
		};
	}
});

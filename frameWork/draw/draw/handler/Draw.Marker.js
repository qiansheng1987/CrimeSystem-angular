EzServerClient.Draw.Marker = EzServerClient.Draw.Feature.extend({
	statics: {
		TYPE: 'marker'
	},

	options: {
		icon: new EzServerClient.Icon.Default(),
		repeatMode: false,
		zIndexOffset: 2000 // This should be > than the highest z-index any markers
	},

	initialize: function (map, options) {
		// Save the type so super can fire, need to do this as cannot do this.TYPE :(
		this.type = EzServerClient.Draw.Marker.TYPE;

		EzServerClient.Draw.Feature.prototype.initialize.call(this, map, options);
	},

	addHooks: function () {
		EzServerClient.Draw.Feature.prototype.addHooks.call(this);

		if (this._map) {
			this._tooltip.updateContent({ text: EzServerClient.drawLocal.draw.handlers.marker.tooltip.start });

			// Same mouseMarker as in Draw.Polyline
			if (!this._mouseMarker) {
				this._mouseMarker = EzServerClient.marker(this._map.getCenter(), {
					icon: EzServerClient.divIcon({
						className: 'leaflet-mouse-marker',
						iconAnchor: [20, 20],
						iconSize: [40, 40]
					}),
					opacity: 0,
					zIndexOffset: this.options.zIndexOffset
				});
			}

			this._mouseMarker
				.on('click', this._onClick, this)
				.addTo(this._map);

			this._map.on('mousemove', this._onMouseMove, this);
		}
	},

	removeHooks: function () {
		EzServerClient.Draw.Feature.prototype.removeHooks.call(this);

		if (this._map) {
			if (this._marker) {
				this._marker.off('click', this._onClick, this);
				this._map
					.off('click', this._onClick, this)
					.removeLayer(this._marker);
				delete this._marker;
			}

			this._mouseMarker.off('click', this._onClick, this);
			this._map.removeLayer(this._mouseMarker);
			delete this._mouseMarker;

			this._map.off('mousemove', this._onMouseMove, this);
		}
	},

	_onMouseMove: function (e) {
		var latlng = e.latlng;

		this._tooltip.updatePosition(latlng);
		this._mouseMarker.setLatLng(latlng);

		if (!this._marker) {
			this._marker = new EzServerClient.Marker(latlng, {
				icon: this.options.icon,
				zIndexOffset: this.options.zIndexOffset
			});
			// Bind to both marker and map to make sure we get the click event.
			this._marker.on('click', this._onClick, this);
			this._map
				.on('click', this._onClick, this)
				.addLayer(this._marker);
		}
		else {
			latlng = this._mouseMarker.getLatLng();
			this._marker.setLatLng(latlng);
		}
	},

	_onClick: function () {
		this._fireCreatedEvent();

		this.disable();
		if (this.options.repeatMode) {
			this.enable();
		}
	},

	_fireCreatedEvent: function () {
		var marker = new EzServerClient.Marker(this._marker.getLatLng(), { icon: this.options.icon });
		EzServerClient.Draw.Feature.prototype._fireCreatedEvent.call(this, marker);
	}
});

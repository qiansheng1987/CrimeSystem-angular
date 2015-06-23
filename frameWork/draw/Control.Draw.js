EzServerClient.Control.Draw = EzServerClient.Control.extend({

	options: {
		position: 'topleft',
		draw: {},
		edit: false
	},

	initialize: function (options) {
		if (EzServerClient.version < '0.7') {
			throw new Error('Leaflet.draw 0.2.3+ requires Leaflet 0.7.0+. Download latest from https://github.com/Leaflet/Leaflet/');
		}

		EzServerClient.Control.prototype.initialize.call(this, options);

		var toolbar;

		this._toolbars = {};

		// Initialize toolbars
		if (EzServerClient.DrawToolbar && this.options.draw) {
			toolbar = new EzServerClient.DrawToolbar(this.options.draw);

			this._toolbars[EzServerClient.DrawToolbar.TYPE] = toolbar;

			// Listen for when toolbar is enabled
			this._toolbars[EzServerClient.DrawToolbar.TYPE].on('enable', this._toolbarEnabled, this);
		}

		if (EzServerClient.EditToolbar && this.options.edit) {
			toolbar = new EzServerClient.EditToolbar(this.options.edit);

			this._toolbars[EzServerClient.EditToolbar.TYPE] = toolbar;

			// Listen for when toolbar is enabled
			this._toolbars[EzServerClient.EditToolbar.TYPE].on('enable', this._toolbarEnabled, this);
		}
	},

	onAdd: function (map) {
		var container = EzServerClient.DomUtil.create('div', 'leaflet-draw'),
			addedTopClass = false,
			topClassName = 'leaflet-draw-toolbar-top',
			toolbarContainer;

		for (var toolbarId in this._toolbars) {
			if (this._toolbars.hasOwnProperty(toolbarId)) {
				toolbarContainer = this._toolbars[toolbarId].addToolbar(map);

				if (toolbarContainer) {
					// Add class to the first toolbar to remove the margin
					if (!addedTopClass) {
						if (!EzServerClient.DomUtil.hasClass(toolbarContainer, topClassName)) {
							EzServerClient.DomUtil.addClass(toolbarContainer.childNodes[0], topClassName);
						}
						addedTopClass = true;
					}

					container.appendChild(toolbarContainer);
				}
			}
		}

		return container;
	},

	onRemove: function () {
		for (var toolbarId in this._toolbars) {
			if (this._toolbars.hasOwnProperty(toolbarId)) {
				this._toolbars[toolbarId].removeToolbar();
			}
		}
	},

	setDrawingOptions: function (options) {
		for (var toolbarId in this._toolbars) {
			if (this._toolbars[toolbarId] instanceof EzServerClient.DrawToolbar) {
				this._toolbars[toolbarId].setOptions(options);
			}
		}
	},

	_toolbarEnabled: function (e) {
		var enabledToolbar = e.target;

		for (var toolbarId in this._toolbars) {
			if (this._toolbars[toolbarId] !== enabledToolbar) {
				this._toolbars[toolbarId].disable();
			}
		}
	}
});

EzServerClient.Map.mergeOptions({
	drawControlTooltips: true,
	drawControl: false
});

EzServerClient.Map.addInitHook(function () {
	if (this.options.drawControl) {
		this.drawControl = new EzServerClient.Control.Draw();
		this.addControl(this.drawControl);
	}
});

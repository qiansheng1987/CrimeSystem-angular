/*EzServerClient.Map.mergeOptions({
	editControl: true
});*/

EzServerClient.EditToolbar = EzServerClient.Toolbar.extend({
	statics: {
		TYPE: 'edit'
	},

	options: {
		edit: {
			selectedPathOptions: {
				color: '#fe57a1', /* Hot pink all the things! */
				opacity: 0.6,
				dashArray: '10, 10',

				fill: true,
				fillColor: '#fe57a1',
				fillOpacity: 0.1,

				// Whether to user the existing layers color
				maintainColor: false
			}
		},
		remove: {},
		featureGroup: null /* REQUIRED! TODO: perhaps if not set then all layers on the map are selectable? */
	},

	initialize: function (options) {
		// Need to set this manually since null is an acceptable value here
		if (options.edit) {
			if (typeof options.edit.selectedPathOptions === 'undefined') {
				options.edit.selectedPathOptions = this.options.edit.selectedPathOptions;
			}
			options.edit.selectedPathOptions = EzServerClient.extend({}, this.options.edit.selectedPathOptions, options.edit.selectedPathOptions);
		}

		if (options.remove) {
			options.remove = EzServerClient.extend({}, this.options.remove, options.remove);
		}

		this._toolbarClass = 'leaflet-draw-edit';
		EzServerClient.Toolbar.prototype.initialize.call(this, options);

		this._selectedFeatureCount = 0;
	},

	getModeHandlers: function (map) {
		var featureGroup = this.options.featureGroup;
		return [
			{
				enabled: this.options.edit,
				handler: new EzServerClient.EditToolbar.Edit(map, {
					featureGroup: featureGroup,
					selectedPathOptions: this.options.edit.selectedPathOptions
				}),
				title: EzServerClient.drawLocal.edit.toolbar.buttons.edit
			},
			{
				enabled: this.options.remove,
				handler: new EzServerClient.EditToolbar.Delete(map, {
					featureGroup: featureGroup
				}),
				title: EzServerClient.drawLocal.edit.toolbar.buttons.remove
			}
		];
	},

	getActions: function () {
		return [
			{
				title: EzServerClient.drawLocal.edit.toolbar.actions.save.title,
				text: EzServerClient.drawLocal.edit.toolbar.actions.save.text,
				callback: this._save,
				context: this
			},
			{
				title: EzServerClient.drawLocal.edit.toolbar.actions.cancel.title,
				text: EzServerClient.drawLocal.edit.toolbar.actions.cancel.text,
				callback: this.disable,
				context: this
			}
		];
	},

	addToolbar: function (map) {
		var container = EzServerClient.Toolbar.prototype.addToolbar.call(this, map);

		this._checkDisabled();

		this.options.featureGroup.on('layeradd layerremove', this._checkDisabled, this);

		return container;
	},

	removeToolbar: function () {
		this.options.featureGroup.off('layeradd layerremove', this._checkDisabled, this);

		EzServerClient.Toolbar.prototype.removeToolbar.call(this);
	},

	disable: function () {
		if (!this.enabled()) { return; }

		this._activeMode.handler.revertLayers();

		EzServerClient.Toolbar.prototype.disable.call(this);
	},

	_save: function () {
		this._activeMode.handler.save();
		this._activeMode.handler.disable();
	},

	_checkDisabled: function () {
		var featureGroup = this.options.featureGroup,
			hasLayers = featureGroup.getLayers().length !== 0,
			button;

		if (this.options.edit) {
			button = this._modes[EzServerClient.EditToolbar.Edit.TYPE].button;

			if (hasLayers) {
				EzServerClient.DomUtil.removeClass(button, 'leaflet-disabled');
			} else {
				EzServerClient.DomUtil.addClass(button, 'leaflet-disabled');
			}

			button.setAttribute(
				'title',
				hasLayers ?
				EzServerClient.drawLocal.edit.toolbar.buttons.edit
				: EzServerClient.drawLocal.edit.toolbar.buttons.editDisabled
			);
		}

		if (this.options.remove) {
			button = this._modes[EzServerClient.EditToolbar.Delete.TYPE].button;

			if (hasLayers) {
				EzServerClient.DomUtil.removeClass(button, 'leaflet-disabled');
			} else {
				EzServerClient.DomUtil.addClass(button, 'leaflet-disabled');
			}

			button.setAttribute(
				'title',
				hasLayers ?
				EzServerClient.drawLocal.edit.toolbar.buttons.remove
				: EzServerClient.drawLocal.edit.toolbar.buttons.removeDisabled
			);
		}
	}
});

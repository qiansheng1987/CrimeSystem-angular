/*
 * EzServerClient.LatLngUtil contains different utility functions for LatLngs.
 */

EzServerClient.LatLngUtil = {
	// Clones a LatLngs[], returns [][]
	cloneLatLngs: function (latlngs) {
		var clone = [];
		for (var i = 0, l = latlngs.length; i < l; i++) {
			clone.push(this.cloneLatLng(latlngs[i]));
		}
		return clone;
	},

	cloneLatLng: function (latlng) {
		return EzServerClient.latLng(latlng.lat, latlng.lng);
	}
};
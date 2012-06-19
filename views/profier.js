/**
 * @author Alex Bowen [alex.bowen@bbc.co.uk]
 * @date 09/11
 */
define('profiler/views/component/profiling', [
    'jquery-1',
    'profiler/views/base'
], function ($, base) {

    /**
     * @exports profiler/views/component/profiling
     * @requires jquery-1
     * @requires profiler/views/base
     */
    var view = {

        init: function (profiles) {

            var methods = '', p, container;

            for (p in profiles) {
                if (p !== null) {
                    methods += '<option value="' + p + '">' + p + '</option>';
                }
            }

            container = '<div id="profile-container">' +
                '<a id="profile-switch">profiling</a>' +
                '<div class="view">' +
                    '<div id="profile-select">' +
                        '<label>graph type</label>' +
                        '<select>' +
                            '<option value="calls">calls</option>' +
                            '<option value="avg">avg</option>' +
                            '<option value="min">min</option>' +
                            '<option value="max">max</option>' +
                        '</select>' +
                    '</div>' +
                    '<div id="method-select">' +
                        '<label>methods</label>' +
                        '<select>' +
                            '<option value="$">jQuery</option>' +
                            methods +
                        '</select>' +
                    '</div>' +
                    '<button id="update">update</button>' +
                    '<button id="clear">clear</button>' +
                '<div id="profile-view"></div>' +
                '</div>' +
            '</div>';

            $('#blq-main').append(container);

            this.$el = $('.view');
        },

        toggle: function () {

            if (this.$el.css('display') === 'none') {
                this.$el.css('display', 'block');
            } else {
                this.$el.css('display', 'none');
            }
        },

        isVisible: function () {
            return this.$el.css('display') === 'block' ? true : false;
        }
    };

    return $.extend(view, base);
});
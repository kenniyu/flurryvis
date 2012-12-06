// define our metrics
var metrics = {
  'all-data': {},
  'active-user-ratio': {},
  'active-total-users': {}
};

/* Empties and hides charts */
function emptyCharts() {
  for (var metricKey in metrics) {
    $('#' + metricKey + '-chart').empty().addClass('inactive');
  }
}

$().ready(function() {
  // add one event listener on the unordered list
  $('.vis-options').live('click', function(e) {
    var $target   = $(e.target),
        targetId  = $target.attr('id'),
        container;

    if (targetId === 'all-data' || targetId === 'active-user-ratio' || targetId === 'active-total-users') {
      // set the container element identifier
      container = '#' + targetId + '-chart';

      // empty both charts, and hide them
      emptyCharts();

      // update the classes of metric buttons
      $target.closest('ul.vis-options').find('li').removeClass('selected');
      $target.closest('li').addClass('selected');

      // instantiate graph for this metric
      new FlurryGraph(targetId);

      // display the current metric container
      $(container).hide().removeClass('inactive').fadeIn();
    }
    e.preventDefault();
  });

  // simulate select of displaying all data
  $('#all-data').trigger('click');

});

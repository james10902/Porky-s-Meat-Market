// Home Page Logic

document.addEventListener('DOMContentLoaded', () => {
  // Initialize heritage timeline if container exists
  const timelineContainer = document.getElementById('heritage-timeline');
  if (timelineContainer) {
    const timeline = new HeritageTimeline(timelineContainer);
    timeline.loadEvents();
  }
});

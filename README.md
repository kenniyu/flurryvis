This node app visualizes the active user ratio data for a particular app tracked by Flurry.

To run (assuming you have npm):

1. Clone this repo.
2. cd into the directory, then run 'npm install' (to install all dependencies).
3. Start the server by running 'node app.js' in the directory.
4. Open up browser and access localhost:3000.


You can modify the json files in the public/json/ directory.
Make sure they're named 'ActiveUsers.json' and 'TotalUsers.json'
Just replace the files and restart the node server.

Open source js libraries used:
- jQuery (http://jquery.com/)
- d3.js (http://d3js.org/)
- jQuery.tipsy (example with code: http://bl.ocks.org/1373263)

Why node?

Just to keep future opportunities open.  For example, with node, clients can view their dashboards in real time. The server can make a POST request to the Flurry API, get the data, and update the client side (not yet implemented)

The server is up for view (using provided sample data) at http://kenniyu.flurry.jit.su/

// scout.js

/* Elements */
var grouplist = document.getElementsByClassName('group-select-list')[0];
var groupIndicator = document.getElementsByClassName('group-select-button')[0];
var login = document.getElementsByClassName('login')[0];
var groupData = document.getElementsByClassName('group-data')[0];

var selectInterface = document.getElementsByClassName('select');
var mainInterface = document.getElementsByClassName('main');

// mode { select / main }
function changeInterfaceTo( mode ) { 
	if (!(mode === 'main' || mode === 'select')) {
		console.log("changeInterfaceTo ERROR: not a valid interface");
	}
	else {
		for (var m = 0, len = mainInterface.length; m < len; m++) {
			mainInterface[m].style.display = mode === 'main' ? 'block' : 'none';
		}

		for (var s = 0, len = selectInterface.length; s < len; s++) {
			selectInterface[s].style.display = mode === 'select' ? 'block' : 'none';
		}
	}
}

function renderChart(id, title, titleX, data) {

	var chart = new CanvasJS.Chart(id, {
		title:{
    		text: title
    	},
    	axisX:{
    		title: titleX
    	},
	});

	chart.options.data = data;
	chart.render();
}

/* ---------------------------------- */
/* ------------Singleton------------- */

var ScoutApp = (function() {

	var instance;

	function init() {
		//private instance variables
		var access_token;
		var groups;
		var current_group = {};

		// return public object
		return {
			getToken: function() {
				return access_token;
			},
			//should only be called after groupme login occurs
			setToken: function() {
				if (!access_token) {
					access_token = location.search.split('token=')[1];
				}
			},
			getGroup: function() {
				return current_group.id;
			},
			getName: function(id) {
				for (var i = 0; i < current_group.members.length; i++) {
					if ( current_group.members[i]['user_id'] === id ) {
						return current_group.members[i]['nickname'];
					}
				}
			},
			setGroup: function(id, name, members) {
				current_group.id = id;
				current_group.name = name;
				current_group.members = members;
			},
			setGroups: function(data) {
				groups = data.response;

				grouplist.innerHTML = "";
				for ( var i = 0; i < groups.length; i++ ) {
					grouplist.insertAdjacentHTML('afterBegin', '<li class="group-item" id="g_' + groups[i].id + '">' + groups[i].name +'</li>');
					document.getElementById('g_' + groups[i].id).addEventListener('click', function(id, name, members) {
						this.setGroup(id, name, members);
						this.loadGroup();
					}.bind(instance, groups[i].id, groups[i].name, groups[i].members), false);
				}
				
				instance.promptGroup();
			},
			//asynchronouse http get request
			getRequest: function(path, callback)
			{
    			var xmlHttp = new XMLHttpRequest();
    			xmlHttp.onreadystatechange = function() { 
         			if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
              			callback(JSON.parse(xmlHttp.responseText));
              		}
    			}
    			xmlHttp.open("GET", 'http://127.0.0.1:5000' + path, true); 
    			xmlHttp.send(null);

			},
			promptGroup: function() {
				if (!groups) {
					app.getRequest('/groups', instance.setGroups);
				}
				else {
					changeInterfaceTo('select');
				}
			},
			loadGroup: function() {
				changeInterfaceTo('main');
				groupIndicator.innerHTML = current_group.name;

				instance.loadMessageData()

			},
			loadMessageData: function(data) {
				if (!data) {
					app.getRequest('/groups/' + current_group.id + '/sift', instance.loadMessageData);
				}
				else {

					instance.loadLikeBreakdown( data['likes_map'] );
					instance.loadWeekComparison( data['week'] );
					instance.loadWordsToLikesComparison( data['user_stats'] );
					instance.loadMessageLengthComparison( data['user_stats'] );
					instance.loadTotalMessagesComparison( data['user_stats'] );
					instance.loadConversationsComparison( data['user_stats'] );
				}
			},
			loadLikeBreakdown: function(data) {

				var chartData_r = [];
				Object.keys(data).forEach( function(key){
					var temp = {
				        type: "stackedBar",
				        legendText: instance.getName(key),
				        showInLegend: "true",
				    };

				    var tempData = [];
				    Object.keys(data[key]).forEach( function(key2) {
				    	tempData.push( { label: instance.getName(key2), y: data[key][key2] } );
				    });
				    temp.dataPoints = tempData;

				    chartData_r.push(temp);
				});

				renderChart('likes-received-chart', 'Number of likes received', '', chartData_r);				
			},
			loadWeekComparison: function(data) {

				var chartData_f = [
					{        
						color: "#B0D0B0",
						type: "column",  
						dataPoints: [   
							{ y: data['6'],  label: "Sunday"},           
							{ y: data['0'], label: "Monday"},
							{ y: data['1'],  label: "Tuesday" },
							{ y: data['2'],  label: "Wednesday"},
							{ y: data['3'],  label: "Thursday"},
							{ y: data['4'],  label: "Friday"},
							{ y: data['5'], label: "Saturday"},
						]
					}
				]

				renderChart('day-frequency-chart', 'Number of messages by weekday', '', chartData_f);
			},
			loadTotalMessagesComparison: function(data) {

				var chartData_tm = [
					{        
						color: "#B0D0B0",
						type: "column",  
						dataPoints: [],
					}
				];

				Object.keys(data).forEach( function(key) {

					chartData_tm[0].dataPoints.push( 
						{ label: instance.getName(key), y: data[key]['total_messages'] } 
					);
				});

				renderChart('total-messages-chart', 'Total messages by user', '', chartData_tm);
			},
			loadConversationsComparison: function(data) {

				var chartData_c = [
					{        
						color: "#B0D0B0",
						type: "column",  
						dataPoints: [],
					}
				];

				Object.keys(data).forEach( function(key) {

					chartData_c[0].dataPoints.push( 
						{ label: instance.getName(key), y: data[key]['conversations'] } 
					);
				});

				renderChart('conversations-started-chart', 'Conversations started by user', '', chartData_c);
			},
			loadMessageLengthComparison: function(data) {

				var chartData_ml = [
					{        
						color: "#B0D0B0",
						type: "column",  
						dataPoints: [],
					}
				];

				Object.keys(data).forEach( function(key) {

					chartData_ml[0].dataPoints.push( 
						{ label: instance.getName(key), y: data[key]['total_words'] / data[key]['total_messages'] } 
					);
				});

				renderChart('message-length-chart', 'Average message length by user', '', chartData_ml);
			},
			loadWordsToLikesComparison: function(data) {

				var chartData_lpm = [
					{        
						color: "#B0D0B0",
						type: "column",  
						dataPoints: [],
					}
				];

				Object.keys(data).forEach( function(key) {

					chartData_lpm[0].dataPoints.push( 
						{ label: instance.getName(key), y: data[key]['total_likes'] / ( data[key]['total_messages'] ) } 
					);
				});

				renderChart('likes-per-message-chart', 'Average likes per message by user', '', chartData_lpm);
			}
		};
	}

	return {
		getInstance: function() {
			if (!instance) {
				instance = init();
			}
			return instance;
		}
	}

})();

/* ---------------------------------- */
/* ---------------------------------- */

var app = ScoutApp.getInstance();
app.setToken();

groupIndicator.addEventListener('click', function(id) {
	app.promptGroup();
}, false);

// User must be logged in
if (!app.getToken()) {
	login.style.display = 'block';
} else {
	login.style.display = 'none';
	app.promptGroup();
}
        

   

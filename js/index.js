$(document).ready(function(){

	//hide sidebar tabs
	$('#big_bets_div').hide();
	$('#stats_div').hide();
	$('#links_div').hide();

	//hide buttons and charts
	$('#reset_button').hide();
	$('#chart_parlay').hide();
	
	//hide parlay table data
	$('#parlay_bets_table_container').hide();

	//for calculating usd price
	var current_wgr_price = 0;

	//get coin and actions info from wgr API
	function api_wgr(){

		//get coin info
		var coin_url = 'https://explorer.wagerr.com/api/coin/';
		$.when(
		$.get(coin_url, function(data){
			current_wgr_price = data.usd;

			$('#wgr_price').html(data.usd);
			var supply = data.supply.toFixed(0);
			$('#wgr_supply').html(Number(supply).toLocaleString('en'));
			var mc = Number(data.supply) * Number(data.usd);
			var mc_2 = Number(mc).toFixed(2);
			$('#wgr_mc').html(Number(mc_2).toLocaleString('en', {minimumFractionDigits: 2}));
		})
		).done(function(){
			//make table and charts
			api_sheets('single', 'chart_single');
			api_sheets('parlay', 'chart_parlay');

		});

		var events_url = "https://explorer.wagerr.com/api/bet/openevents";
		var open_events = [];
		//get open events
		$.when(
		$.get(events_url, function(data){
			//loop through open events
			$.each(data.events, function(k,v){
				open_events.push(v.eventId);
			});
			
		})
		).done(function(){

			/*console.log("Event count = "+ open_events.length);*/
			//add open events total
			$('#open_event').html(open_events.length);

			//make bet amount and event info urls
			var action_url ="https://explorer.wagerr.com/api/bet/actions?"
			var info_url = "https://explorer.wagerr.com/api/bet/events?"

			//Make query string for each open event
			$.each(open_events, function(k,v){
				action_url += "eventId="+v+"&";
				info_url += "eventId="+v+"&";
			});

			//get all bets
			$.get(action_url, function(data){
				var open_total = 0;
				/*var open_total_usd = 0;*/
				var prev_id = [];
				var pending_bets =[];
				//create bigbets array
				var bets_action =[];
				
				//combine each bet into eventId
				$.each(data.actions, function(k,v){

					if(v.completed == false){
						open_total += v.betValue;
						/*open_total_usd += v.betValueUSD;*/
						bets_action.push(v);

						if(prev_id.includes(v.eventId)){
							var index = check_id(v.eventId);

							pending_bets[index].info[0].bet += v.betValue;
							pending_bets[index].info[0].usd += v.betValueUSD;

						}else{
							var id_obj = {event_id: v.eventId, info:[{bet: v.betValue, usd: v.betValueUSD}]};
							pending_bets.push( id_obj );
						}
						prev_id.push(v.eventId);
					}
				});
					function check_id(id){
						kk = "";
						$.each(pending_bets, function(k,v){
							if(id == v.event_id){
								kk = k;
							}
						});

						return (kk);
					}

				//combine big bets with same date
				var bets_action_combined = [];
				$.each(bets_action, function(k,v){
					var date = new Date(v.createdAt);
					var index = combine_big_bets(date.getTime(), v.eventId, v.betChoose);

					if(index == -1){
						var obj = {createdAt: v.createdAt, betValue: v.betValue, eventId: v.eventId, betChoose: v.betChoose };
						bets_action_combined.push(obj);
					}else{
					
						bets_action_combined[index].betValue += v.betValue;
						
					}		
				});
					//combine big bets helper function
					function combine_big_bets(date, event_id, bet_type){
						var kk = -1;
						$.each(bets_action_combined, function(k,v){
							var date_array = new Date(v.createdAt);
							if(date == date_array.getTime() && event_id == v.eventId && bet_type == v.betChoose){
								//only want 1 match
								if (kk == -1){
									//set index for return
									kk = k;
								}
							}

						});
						return(kk);

					}

					
				//sort big bets - high to low	
				bets_action_combined.sort(function(a,b){
					if(a.betValue > b.betValue ){
						return -1;
					}else if(a.betValue < b.betValue){
						return 1;
					}else{
						return 0;
					}
				});


				//Append big bets
				$.each(bets_action_combined, function(k,v){
					var bet = Number(v.betValue.toFixed(0)).toLocaleString('en');
					var bet_usd = Number(eval(v.betValue*current_wgr_price)).toFixed(2);;
					var bet_usd = Number(bet_usd).toLocaleString('en', {minimumFractionDigits: 2});
					var time = new Date(v.createdAt);
					var new_time = time.toString().substr(4).split(' G')[0];
			
					//append bigbets
					$('#big_bets_info').append('\
						<tr>\
							<td>'+eval(k+1)+'</td>\
							<td><a target="_blank" href="https://explorer.wagerr.com/#/bet/event/'+v.eventId+'">'+v.eventId+'</a></td>\
							<td>'+v.betChoose+'</td>\
							<td>'+new_time+'</td>\
							<td>'+bet+' WGR</td>\
							<td>$'+bet_usd+'</td>\
						</tr>\
					');


				});

				//big bets array length
				$('#big_bet_placed').html(bets_action.length+" (Actual: "+bets_action_combined.length +")");


				//add total wgr bets
				$('#open_bet_wgr, #big_bet_wgr').html(Number(open_total).toLocaleString('en', {maximumFractionDigits: 0}) + " WGR");

				//add total usd bets using current price!
				var open_total_usd_calc = eval(open_total*current_wgr_price);
				$('#open_bet_usd, #big_bet_usd').html("$"+ Number(open_total_usd_calc).toLocaleString('en', {minimumFractionDigits: 2 ,maximumFractionDigits: 2}));


				/*//add total usd bets (Using bet action array info so bet value is whatever the wgr price was when bet was placed)
				var open_total_usd = open_total_usd.toFixed(2);
				$('#open_bet_usd').html("$"+ Number(open_total_usd).toLocaleString('en'));*/


				//add ids with no bets
				$.each(open_events, function(k,v){
					var result = add_id(v);
					if(result == false){
						var id_obj = {event_id: v, info:[{bet: 0, usd: 0}]};
						pending_bets.push( id_obj );
					}

				});
					function add_id(id){
						var match = false;
						$.each(pending_bets, function(k,v){
							
							if(id == v.event_id){
								match = true;
							}
						});
						return (match);
					}

				//get event info array
				$.when(
				$.get(info_url, function(data_2){
					$.each(data_2.events, function(k,v){
						var index = check_event_info(v.eventId);
						var indexed = pending_bets[index].info[0];
						indexed['league'] = v.league;
						indexed['home'] = v.homeTeam;
						indexed['away'] = v.awayTeam;
					});

						function check_event_info(id){
							kk = "";
							$.each(pending_bets, function(k,v){
								if(id == v.event_id){
									kk = k;
								}
							});

							return (kk);

						}

				})
				).done(function(){
					//sort the bets from high to low for each event
					var pending_bets_sorted = [];
					$.each(pending_bets, function(k,v){
						//push first to array
						if(k ==0){
							pending_bets_sorted.push(v);
						//sort the rest using the function
						}else{
							var new_position = check_bets(v.info[0].bet);
							pending_bets_sorted.splice(new_position, 0, v);
						}
					});

						//sort high to low based on bet amount
						function check_bets(bet){
							var kk = 0;
							$.each(pending_bets_sorted, function(k,v){
									if(bet <= v.info[0].bet){
										if(k >= kk){
											kk = k+1;
										}
									}else if(bet > v.info[0].bet){
										if(k < kk){
											kk = k-1;
										}
									}
							});
							return (kk);	
						}
					
					//append each to table
					$.each(pending_bets_sorted, function(k,v){
						
						var bet = Number(v.info[0].bet.toFixed(0)).toLocaleString('en');
						var usd = Number(v.info[0].usd.toFixed(0)).toLocaleString('en');	
						
						var league = v.info[0].league;
						var home = v.info[0].home;
						var away = v.info[0].away;

						$('#open_events_info').append('\
							<tr>\
								<td>'+eval(k+1)+'</td>\
								<td><a target="_blank" href="https://explorer.wagerr.com/#/bet/event/'+v.event_id+'">'+v.event_id+'</a></td>\
								<td>'+league+'</td>\
								<td>'+home+'</td>\
								<td>'+away+'</td>\
								<td>'+bet+' WGR</td>\
								<td>$'+usd+'</td>\
							</tr>\
						');
					});

					//click top open events button
					$(document).on('click', '#top_open_button', function(){
						$(this).addClass('side-bar-item-active');
						$('#big_bets_button').removeClass('side-bar-item-active');
						$('#stats_button').removeClass('side-bar-item-active');
						$('#links_button').removeClass('side-bar-item-active');

						$('#big_bets_div').hide();
						$('#stats_div').hide();
						$('#links_div').hide();
						$('#top_open_div').show();
						

					});

					//click big bets button
					$(document).on('click', '#big_bets_button', function(){
						$(this).addClass('side-bar-item-active');
						$('#top_open_button').removeClass('side-bar-item-active');
						$('#stats_button').removeClass('side-bar-item-active');
						$('#links_button').removeClass('side-bar-item-active');

						$('#top_open_div').hide();
						$('#stats_div').hide();
						$('#links_div').hide();
						$('#big_bets_div').show();
						
						

					});

					//click stats button
					$(document).on('click', '#stats_button', function(){
						$(this).addClass('side-bar-item-active');
						$('#top_open_button').removeClass('side-bar-item-active');
						$('#big_bets_button').removeClass('side-bar-item-active');
						$('#links_button').removeClass('side-bar-item-active');
						
						$('#top_open_div').hide();
						$('#big_bets_div').hide();
						$('#links_div').hide();
						$('#stats_div').show();
						
						

					});

					//click links button
					$(document).on('click', '#links_button', function(){
						$(this).addClass('side-bar-item-active');
						$('#top_open_button').removeClass('side-bar-item-active');
						$('#big_bets_button').removeClass('side-bar-item-active');
						$('#stats_button').removeClass('side-bar-item-active');
						
						$('#top_open_div').hide();
						$('#big_bets_div').hide();
						$('#stats_div').hide();
						$('#links_div').show();
						
						

					});

					//click to change chart and table data to single bets
					$(document).on('click', '#parlay', function(){
						//charts show/hide
						$('#chart_single').hide();
						$('#chart_parlay').show();
						//tables show/hide
						$('#single_bets_table_container').hide();
						$('#parlay_bets_table_container').show();

					});

					//click to change chart and table data to parlays bets
					$(document).on('click', '#single', function(){
						//charts show/hide
						$('#chart_parlay').hide();
						$('#chart_single').show();
						//tables show/hide
						$('#parlay_bets_table_container').hide();
						$('#single_bets_table_container').show();
						
					});	

				});	
			});
		});	

	}

	//run function to load page
	api_wgr();


	//get data for appscripts api
	function api_sheets(bet_type, chart_id){
		//app scripts call
		var scripts_url = "https://script.google.com/macros/s/AKfycbwef5MijvQ7HZqTReearN1zASPhLJHe7-sBNMMLmbBXCG7WY9UHuGJHl90DkJ_SsoT0/exec?betType="+bet_type+"";
		 $.get(scripts_url).done(function(data){
		 	var result = JSON.parse(data);
		 	make_chart(result, chart_id);

		 	if(bet_type == 'single'){
		 		make_stats_table(result, 'single');
		 	}else{
		 		make_stats_table(result, 'parlay');
		 	}
		 	
		 	
		 });	 
	}

	//make charts and call to make table
	function make_chart(data_in, chart_id){
		var data_total = [];
		var data_win = [];
		$.each(data_in, function(k,v){
			var date = new Date(v.date);
			var year = date.getFullYear();
			var month = eval(date.getMonth()+1);
			var day = date.getDate();

			data_total.push( {x: moment(v.date), y: v.wgr_total} );
			data_win.push( {x: moment(v.date), y: v.wgr_payout} );
		});

		var ctx = $('#'+chart_id);
		var myChart = new Chart(ctx, {
			type: 'bar',
			data: {
				datasets: [{
					label: " Total WGR Bet",
					data: data_total,
					backgroundColor: [ 'red']

				},{
					label: " Total WGR Won",
					data: data_win,
					backgroundColor: [ 'green']

				}
				],
				

			},
			options: {
				plugins: {
			      	zoom: {
				        zoom: {
				          enabled: true,
				          mode: 'x',
				          onZoomComplete: function(myChart) {
			         		$('#reset_button').show();

						   }
				        },
				        pan: {
				        	enabled: true,
				        	mode: 'x',
				        	rangeMin: {
				        		x: null
				        	}
				        }
			      	},
			      	legend: {
			      		title: {
			      			display: true,
			      			text: "Click below to add or remove data",
			      		}
			      	}					      		
			    },
				scales: {

		            x: {
		            	title:{
		            		display: true,
		            		text: 'Date',
		            	},			
		                type: 'time',				            				       
		                time: {				   
		                	unit: 'day',
		                	stepSize: 1,		     
		                    displayFormats: {
		                    	day: 'MMM DD, YYYY',
		                    	month: 'MMM YYYY',
		                    	week: 'MMM DD, YYYY',
		                    	
		                    },
		                    tooltipFormat: 'dddd MMM DD, YYYY', 
		                },
		                
		            },
		            y: {
		            	title: {
		            		display: true,
		            		text: 'WGR'
		            	}
		            }
			        
				
				}

			}	
		},
		);

		$('#reset_button').click(function(){
		    myChart.resetZoom();
		    
		});
		$('#month_button').click(function(){
			 
			myChart.options.scales.x.time.unit = 'month';
			myChart.update();
		    
		});

		$('#day_button').click(function(){
			myChart.options.scales.x.time.unit = 'day';
			myChart.update();
			
	
		});

		$('#week_button').click(function(){
			myChart.options.scales.x.time.unit = 'week';
			myChart.update();
			
	
		});

	}

	//make tables using appscripts data
	var totals_bets = [];
	function make_stats_table(data, table_id){

		var single_sum = 0;
		var single_payout_sum =0;
		var single_change_sum = 0
		$.each(data, function(k,v){
			//change date format
			var date= moment(v.date).format('MMM DD, YYYY');

			//add sums
			single_sum += v.wgr_total;
			single_payout_sum += v.wgr_payout;
			single_change_sum += eval(v.wgr_total - v. wgr_payout);


			//append to stats table
			$('#'+table_id+'_bets_info').append('\
				<tr>\
					<td>'+eval(k+1)+'</td>\
					<td>'+date+'</td>\
					<td>'+Number(v.wgr_total.toFixed(0)).toLocaleString('en')+' WGR<br> ($'+Number(eval(v.wgr_total*current_wgr_price)).toLocaleString('en', {minimumFractionDigits: 2, maximumFractionDigits: 2 })+' USD)</td>\
					<td>'+Number(v.wgr_payout.toFixed(0)).toLocaleString('en')+' WGR<br>($'+Number(eval(v.wgr_payout*current_wgr_price)).toLocaleString('en', {minimumFractionDigits: 2, maximumFractionDigits: 2})+' USD)</td>\
					<td>'+Number(eval(v.wgr_total -  v.wgr_payout).toFixed(0)).toLocaleString('en')+' WGR<br>($'+Number(eval((v.wgr_total -  v.wgr_payout)*current_wgr_price)).toLocaleString('en', {minimumFractionDigits: 2, maximumFractionDigits: 2})+' USD)</td>\
				</tr>\
			');


		});

		//append tables totals
		$('#table_total_'+table_id).html(Number(single_sum).toLocaleString('en', {maximumFractionDigits: 0}) + ' WGR <br>($'+ Number(eval(single_sum*current_wgr_price)).toLocaleString('en', {minimumFractionDigits: 2, maximumFractionDigits:2} ) + ' USD)');
		$('#table_total_'+table_id+'_payout').html(Number(single_payout_sum).toLocaleString('en', {maximumFractionDigits: 0})+ ' WGR <br>($'+ Number(eval(single_payout_sum*current_wgr_price)).toLocaleString('en', {minimumFractionDigits: 2, maximumFractionDigits:2}) + ' USD)');
		$('#table_total_'+table_id+'_change').html(Number(single_change_sum).toLocaleString('en', {maximumFractionDigits: 0}) + ' WGR <br>($'+ Number(eval(single_change_sum*current_wgr_price)).toLocaleString('en', {minimumFractionDigits: 2, maximumFractionDigits:2}) + ' USD)');

		$('#'+table_id+'_placed').html( Number(single_sum).toLocaleString('en', {maximumFractionDigits: 0}) + ' WGR <br>($'+ Number(eval(single_sum*current_wgr_price)).toLocaleString('en', {minimumFractionDigits: 2, maximumFractionDigits:2} ) + ' USD)' );

		totals_bets.push( {total: single_sum, payout: single_payout_sum, change: single_change_sum} );
		update_totals_table(totals_bets);
		
	}

	//add totals to table
	function update_totals_table(total){
		var total_bets = 0;
		var total_payouts = 0;
		var total_changes = 0;
		$.each(total, function(k,v){
			total_bets += v.total;
			total_payouts +=v.payout;
			total_changes += v.change;
		});
		$('#total_placed').html(Number(total_bets).toLocaleString('en', {maximumFractionDigits: 0}) );
		$('#total_usd').html('$'+Number( eval(total_bets*current_wgr_price) ).toLocaleString('en',{ maximumFractionDigits: 2, minimumFractionDigits: 2}) + ' USD' );
		$('#supply_placed').html(Number(total_changes).toLocaleString('en', {maximumFractionDigits: 0}) );
	}

	
});
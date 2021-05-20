$(document).ready(function(){
	console.log('his');
	//hide sidebar tabs
	$('#big_bets_div').hide();
	$('#stats_div').hide();
	$('#links_div').hide();
	$('#picks_div').hide();

	//hide buttons and charts
	$('#reset_button').hide();
	$('#chart_parlay').hide();
	$('#chart_mint').hide();
	
	//hide parlay table data
	$('#parlay_bets_table_container').hide();
	//hide mint table data
	$('#mint_table_container').hide();

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
			api_sheets('mint', 'chart_mint');
			add_picks();

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
					
					//append each Open Event to table
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


					//add team name to Big Bets before append
					$.each(bets_action_combined, function(k,v){
						if(v.betChoose.includes('Home')){
							var home_team = team_add_big_bets(v.eventId,'home');
							bets_action_combined[k]['team'] = home_team;
						
						}else if(v.betChoose.includes('Away')){
							var away_team = team_add_big_bets(v.eventId,'away');
							bets_action_combined[k]['team'] = away_team;
						}else if(v.betChoose.includes('Totals') || v.betChoose.includes('Draw')){
							var vs_team = team_add_big_bets(v.eventId,'totals');
							bets_action_combined[k]['team'] = vs_team;

						}

					});

					//helper to get team name for big bets
					function team_add_big_bets(eventId, betChoose){
						var team_name = null;

						$.each(pending_bets_sorted, function(k,v){
							if(v.event_id == eventId){
								if(betChoose == 'home'){
									team_name = v.info[0].home;
								}else if(betChoose == 'away'){
									team_name = v.info[0].away;
								}else if(betChoose == 'totals'){
									var home = v.info[0].home;
									var away = v.info[0].away;
									team_name = home + ' vs. ' + away;
								}
							}
						});
						return(team_name);

					}

					//Append to big bets
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
								<td>'+v.team+'</td>\
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



					//Buttons Click


					//click top open events button
					$(document).on('click', '#top_open_button', function(){
						$('div').removeClass('side-bar-item-active');
						$(this).addClass('side-bar-item-active');

						$('#big_bets_div').hide();
						$('#stats_div').hide();
						$('#picks_div').hide();
						$('#links_div').hide();
						$('#top_open_div').show();
						
					});

					//click big bets button
					$(document).on('click', '#big_bets_button', function(){
						$('div').removeClass('side-bar-item-active');
						$(this).addClass('side-bar-item-active');

						$('#top_open_div').hide();
						$('#stats_div').hide();
						$('#picks_div').hide();
						$('#links_div').hide();
						$('#big_bets_div').show();
						
					});

					//click stats button
					$(document).on('click', '#stats_button', function(){
						$('div').removeClass('side-bar-item-active');
						$(this).addClass('side-bar-item-active');
						
						$('#top_open_div').hide();
						$('#big_bets_div').hide();
						$('#picks_div').hide();
						$('#links_div').hide();
						$('#stats_div').show();
						
					});

					//click picks button
					$(document).on('click', '#picks_button', function(){
						$('div').removeClass('side-bar-item-active');
						$(this).addClass('side-bar-item-active');
						
						$('#top_open_div').hide();
						$('#big_bets_div').hide();
						$('#stats_div').hide();
						$('#links_div').hide();
						$('#picks_div').show();
					});

					//click links button
					$(document).on('click', '#links_button', function(){
						$('div').removeClass('side-bar-item-active');
						$(this).addClass('side-bar-item-active');
					
						
						$('#top_open_div').hide();
						$('#big_bets_div').hide();
						$('#stats_div').hide();
						$('#picks_div').hide();
						$('#links_div').show();
						
					});

					//click to change chart and table data to single bets
					$(document).on('click', '#parlay', function(){
						//charts show/hide
						$('#chart_single').hide();
						$('#chart_mint').hide();
						$('#chart_parlay').show();
						//tables show/hide
						$('#single_bets_table_container').hide();
						$('#mint_table_container').hide();
						$('#parlay_bets_table_container').show();

					});

					//click to change chart and table data to parlays bets
					$(document).on('click', '#totalmint', function(){
						//charts show/hide
						$('#chart_parlay').hide();
						$('#chart_single').hide();
						$('#chart_mint').show();
						//tables show/hide
						$('#parlay_bets_table_container').hide();
						$('#single_bets_table_container').hide();
						$('#mint_table_container').show();
						
					});

					//click to change chart and table data to parlays bets
					$(document).on('click', '#single', function(){
						//charts show/hide
						$('#chart_parlay').hide();
						$('#chart_mint').hide();
						$('#chart_single').show();
						//tables show/hide
						$('#parlay_bets_table_container').hide();
						$('#mint_table_container').hide();
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
		var scripts_url = "https://script.google.com/macros/s/AKfycbwG9LNM70OIgcD0YEt6eVAagrKSYMDxkns6lw7AA_37HWj-CZqHbUJRgn1oHmus9fw8/exec?betType="+bet_type+"";
		 $.get(scripts_url).done(function(data){
		 	var result = JSON.parse(data);
		 	

		 	if(bet_type == 'single'){
		 		make_chart(result, chart_id);
		 		make_stats_table(result, 'single');
		 	}else if(bet_type == 'parlay'){
		 		make_chart(result, chart_id);
		 		make_stats_table(result, 'parlay');
		 	}else if(bet_type == 'mint'){
		 		make_chart_mint(result, chart_id);
		 		make_stats_table(result, 'mint');

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
	//make charts and call to make table
	function make_chart_mint(data_in, chart_id){
		var data_total = [];
		$.each(data_in, function(k,v){
			var date = new Date(v.date);
			var year = date.getFullYear();
			var month = eval(date.getMonth()+1);
			var day = date.getDate();

			data_total.push( {x: moment(v.date), y: v.mint} );
			
		});

		var ctx = $('#'+chart_id);
		var myChart = new Chart(ctx, {
			type: 'bar',
			data: {
				datasets: [{
					label: " Total WGR Mint",
					data: data_total,
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

		if(table_id != 'mint'){

			var single_sum = 0;
			var single_payout_sum =0;
			var single_change_sum = 0
			var event_sum = 0;
			$.each(data, function(k,v){
				//change date format
				var date= moment(v.date).format('MMM DD, YYYY');

				//add sums
				single_sum += Number(v.wgr_total.toFixed(0));
				single_payout_sum += Number(v.wgr_payout.toFixed(0));
				single_change_sum += eval(Number(v.wgr_payout.toFixed(0)) - Number(v.wgr_total.toFixed(0)) );

				//different table size for single bets
				if(table_id == 'single'){
					//add event totals
					event_sum += v.event_count;
					//append to stats table
					$('#'+table_id+'_bets_info').append('\
						<tr>\
							<td>'+eval(k+1)+'</td>\
							<td>'+date+'</td>\
							<td>'+v.event_count+'</td>\
							<td>'+Number(v.wgr_total.toFixed(0)).toLocaleString('en')+' WGR<br> ($'+Number(eval(v.wgr_total*current_wgr_price)).toLocaleString('en', {minimumFractionDigits: 2, maximumFractionDigits: 2 })+' USD)</td>\
							<td>'+Number(v.wgr_payout.toFixed(0)).toLocaleString('en')+' WGR<br>($'+Number(eval(v.wgr_payout*current_wgr_price)).toLocaleString('en', {minimumFractionDigits: 2, maximumFractionDigits: 2})+' USD)</td>\
							<td>'+Number(eval(v.wgr_payout -  v.wgr_total).toFixed(0)).toLocaleString('en')+' WGR<br>($'+Number(eval((v.wgr_payout -  v.wgr_total)*current_wgr_price)).toLocaleString('en', {minimumFractionDigits: 2, maximumFractionDigits: 2})+' USD)</td>\
						</tr>\
					');


				}else{

					//append to stats table
					$('#'+table_id+'_bets_info').append('\
						<tr>\
							<td>'+eval(k+1)+'</td>\
							<td>'+date+'</td>\
							<td>'+Number(v.wgr_total.toFixed(0)).toLocaleString('en')+' WGR<br> ($'+Number(eval(v.wgr_total*current_wgr_price)).toLocaleString('en', {minimumFractionDigits: 2, maximumFractionDigits: 2 })+' USD)</td>\
							<td>'+Number(v.wgr_payout.toFixed(0)).toLocaleString('en')+' WGR<br>($'+Number(eval(v.wgr_payout*current_wgr_price)).toLocaleString('en', {minimumFractionDigits: 2, maximumFractionDigits: 2})+' USD)</td>\
							<td>'+Number(eval(v.wgr_payout -  v.wgr_total).toFixed(0)).toLocaleString('en')+' WGR<br>($'+Number(eval((v.wgr_payout -  v.wgr_total)*current_wgr_price)).toLocaleString('en', {minimumFractionDigits: 2, maximumFractionDigits: 2})+' USD)</td>\
						</tr>\
					');
				}

				


			});

			//append tables totals
			$('#table_total_'+table_id+'_events').html(event_sum.toLocaleString('en'));
			$('#table_total_'+table_id).html(Number(single_sum).toLocaleString('en', {maximumFractionDigits: 0}) + ' WGR <br>($'+ Number(eval(single_sum*current_wgr_price)).toLocaleString('en', {minimumFractionDigits: 2, maximumFractionDigits:2} ) + ' USD)');
			$('#table_total_'+table_id+'_payout').html(Number(single_payout_sum).toLocaleString('en', {maximumFractionDigits: 0})+ ' WGR<br>($'+ Number(eval(single_payout_sum*current_wgr_price)).toLocaleString('en', {minimumFractionDigits: 2, maximumFractionDigits:2}) + ' USD)');
			$('#table_total_'+table_id+'_change').html(Number(single_change_sum).toLocaleString('en', {maximumFractionDigits: 0}) + ' WGR<br>($'+ Number(eval(single_change_sum*current_wgr_price)).toLocaleString('en', {minimumFractionDigits: 2, maximumFractionDigits:2}) + ' USD)');

			$('#'+table_id+'_placed').html( Number(single_sum).toLocaleString('en', {maximumFractionDigits: 0}) + ' WGR<br>($'+ Number(eval(single_sum*current_wgr_price)).toLocaleString('en', {minimumFractionDigits: 2, maximumFractionDigits:2} ) + ' USD)' );

			
			$('#'+table_id+'_date_picker_append').append('<div class="date-picker">\
											<label for="'+table_id+'_start_date">Date Start: </label>\
											<input class="date-input" id="'+table_id+'_start_date" type="date" name="start" value="2021-01-01">\
											</div>\
											<div class="date-picker">\
												<label for="'+table_id+'_end_date">Date End:</label> \
												<input class="date-input" id="'+table_id+'_end_date" type="date" name="">\
											</div>\
											<div>\
											<button class="date-reset btn btn-primary" id="'+table_id+'_reset_button">Reset</button>\
											</div>');
			totals_bets.push( {total: single_sum, payout: single_payout_sum, change: single_change_sum, event_sum: event_sum} );
			update_totals_table(totals_bets);

		}else{

			var mint_sum = 0;
			$.each(data, function(k,v){
				//change date format
				var date= moment(v.date).format('MMM DD, YYYY');

				//add sums
				mint_sum += Number(v.mint.toFixed(0));

				//append to stats table
				$('#'+table_id+'_info').append('\
					<tr>\
						<td>'+eval(k+1)+'</td>\
						<td>'+date+'</td>\
						<td>'+Number(v.mint.toFixed(0)).toLocaleString('en')+' WGR<br> ($'+Number(eval(v.mint*current_wgr_price)).toLocaleString('en', {minimumFractionDigits: 2, maximumFractionDigits: 2 })+' USD)</td>\
					</tr>\
				');
			});

			//append tables totals
			$('#table_total_'+table_id).html(Number(mint_sum).toLocaleString('en', {maximumFractionDigits: 0}) + ' WGR <br>($'+ Number(eval(mint_sum*current_wgr_price)).toLocaleString('en', {minimumFractionDigits: 2, maximumFractionDigits:2} ) + ' USD)');
			
			$('#'+table_id+'_date_picker_append').append('<div class="date-picker">\
											<label for="'+table_id+'_start_date">Date Start: </label>\
											<input class="date-input" id="'+table_id+'_start_date" type="date" name="start" value="2021-01-01">\
											</div>\
											<div class="date-picker">\
												<label for="'+table_id+'_end_date">Date End:</label> \
												<input class="date-input" id="'+table_id+'_end_date" type="date" name="">\
											</div>\
											<div>\
											<button class="date-reset btn btn-primary" id="'+table_id+'_reset_button">Reset</button>\
											</div>');

			$('#total_payout_mint').html(Number(mint_sum).toLocaleString('en', {maximumFractionDigits: 0}) + ' WGR<br>' + '($'+Number( eval(mint_sum*current_wgr_price) ).toLocaleString('en',{ maximumFractionDigits: 2, minimumFractionDigits: 2}) + ' USD)' );

			totals_bets.push( {total: 0, payout: 0, change: 0, event_sum: 0, mint: mint_sum} );
			update_totals_table(totals_bets);
		}

		
		
	}

	//add totals to table
	function update_totals_table(total){

		var total_bets = 0;
		var total_payouts = 0;
		var total_changes = 0;
		var total_events = 0;
		var mint_sum = 0;



		$.each(total, function(k,v){
			total_bets += v.total;
			total_payouts +=v.payout;
			total_changes += v.change;
			total_events += v.event_sum;
			if(v.mint){
				mint_sum += v.mint;
			}
			
			
		});

		var mint_change = eval(mint_sum - total_bets);

		console.log(total_bets);
		console.log(mint_change);

		$('#total_placed').html(Number(total_bets).toLocaleString('en', {maximumFractionDigits: 0}) + ' WGR<br>' + '($'+Number( eval(total_bets*current_wgr_price) ).toLocaleString('en',{ maximumFractionDigits: 2, minimumFractionDigits: 2}) + ' USD)' );
		$('#total_payout').html(Number(total_payouts).toLocaleString('en', {maximumFractionDigits: 0}) + ' WGR<br>' + '($'+Number( eval(total_payouts*current_wgr_price) ).toLocaleString('en',{ maximumFractionDigits: 2, minimumFractionDigits: 2}) + ' USD)' );
		$('#events_completed').html(total_events);
		if(total_changes > 0){
			$('#supply_placed').html('+ '+Number(total_changes).toLocaleString('en', {maximumFractionDigits: 0}) + ' WGR<br>($'+ Number(eval(total_changes*current_wgr_price)).toLocaleString('en', {minimumFractionDigits: 2, maximumFractionDigits:2}) + ' USD)');
		}else{
			$('#supply_placed').html(Number(mint_change).toLocaleString('en', {maximumFractionDigits: 0}) + ' WGR<br>($'+ Number(eval(mint_change*current_wgr_price)).toLocaleString('en', {minimumFractionDigits: 2, maximumFractionDigits:2}) + ' USD)' );
		}
		

		//RUN table sort
		totals_table_sort();
	}

	//sort the totals table
	function totals_table_sort(){
		//add end date
		var today = new Date();
		//go back one day
		today.setDate(today.getDate() - 1);
		//change format for input
		var today_format = new Date(today).toLocaleDateString('en-CA');

		//append today - 1
		$('#single_end_date, #parlay_end_date, #mint_end_date').val(today_format);

		//date picker on change update table values
		$('.date-input').on('change', function(){
			var id_type = $(this).attr('id').split('_')[0];
			var start = $('#' + id_type + '_start_date').val();
			var end = $('#'+ id_type + '_end_date' ).val();

			//run update table values function
			sort_table(start, end, id_type);

		});

		//reset button for date picker click
		$('.date-reset').on('click', function(){
			//get single or parlay
			var i_d = $(this).attr('id').split('_')[0];
			// reset end anstart dates
			$('#'+i_d+'_end_date').val(today_format).trigger('change');;
			$('#'+i_d+'_start_date').val('2021-01-01').trigger('change');;


		});

		function sort_table(start, end, table){
			//get new totals
			var wgr_placed = 0;
			var usd_placed = 0;
			var wgr_payout = 0;
			var usd_payout = 0;
			var wgr_events = 0;

			var wgr_mint = 0;
			var usd_mint = 0;
			//Loop each row and find date and totals
			if(table != 'mint'){
				$('#'+table+'_bets_info > tr').each(function(k,v){
					var row_date = new Date($(this).children('td').eq(1).html()).toLocaleDateString('en-CA');
					//hide row if outside date range
					if(row_date < start || row_date > end){
						$(this).hide();
					//show row if inside date range
					}else{
						$(this).show();
						//for single bets as they have an extra column for event totals
						var row_init = 2;
						if(table == 'single'){
							row_init = 3;
							//count events
							wgr_events += Number($(this).children('td').eq(2).html());
						}


						//get wager sinlge bets placed data
						var wgr_row_placed = $(this).children('td').eq(row_init).html().split(' WGR')[0].replaceAll(',', '');
						wgr_placed += Number(wgr_row_placed);
						var usd_row_placed = $(this).children('td').eq(row_init).html().split(' WGR')[1].split(' USD')[0].split('$').pop().replaceAll(',', '');
						usd_placed += Number(usd_row_placed);

						//get single bet payouts
						var wgr_row_payout = $(this).children('td').eq(eval(row_init + 1)).html().split(' WGR')[0].replaceAll(',', '');
						wgr_payout += Number(wgr_row_payout);
						var usd_row_payout = $(this).children('td').eq(eval(row_init + 1)).html().split(' WGR')[1].split(' USD')[0].split('$').pop().replaceAll(',', '');
						usd_payout += Number(usd_row_payout);

						


					}
				});

				//append new totals to table
				$('#table_total_'+table).html(wgr_placed.toLocaleString('en', {maximumFractionDigits: 0}) + " WGR<br>($" + usd_placed.toLocaleString('en', {maximumFractionDigits: 2}) + ' USD)' );
				$('#table_total_'+table+'_payout').html(wgr_payout.toLocaleString('en', {maximumFractionDigits: 0}) + " WGR<br>($" + usd_payout.toLocaleString('en', {maximumFractionDigits: 2}) + ' USD)' );
				$('#table_total_'+table+'_change').html(eval(wgr_payout - wgr_placed).toLocaleString('en', {maximumFractionDigits: 0}) + " WGR<br>($" + eval(usd_payout - usd_placed).toLocaleString('en', {maximumFractionDigits: 2}) + ' USD)' );

				if(table == 'single'){
					$('#table_total_'+table+'_events').html(wgr_events.toLocaleString('en'));

				}


			}else{
				$('#'+table+'_info > tr').each(function(k,v){
					var row_date = new Date($(this).children('td').eq(1).html()).toLocaleDateString('en-CA');
					//hide row if outside date range
					if(row_date < start || row_date > end){
						$(this).hide();
					//show row if inside date range
					}else{
						$(this).show();

						//get wager sinlge bets placed data
						var wgr_mint_row = $(this).children('td').eq(2).html().split(' WGR')[0].replaceAll(',', '');
						wgr_mint += Number(wgr_mint_row);
						var usd_mint_row = $(this).children('td').eq(2).html().split(' WGR')[1].split(' USD')[0].split('$').pop().replaceAll(',', '');
						usd_mint += Number(usd_mint_row);

					}
				});

				//append new totals to table
				$('#table_total_'+table).html(wgr_mint.toLocaleString('en', {maximumFractionDigits: 0}) + " WGR<br>($" + usd_mint.toLocaleString('en', {maximumFractionDigits: 2}) + ' USD)' );

			}
			
		}
	}

	//add pick to table
	function add_picks(){
		var picks_url = " https://script.google.com/macros/s/AKfycbwR8r3fyIyf4XPEe2KtZabyZ0GgBFs8Br4aknT0MECNZmZmFYvV2OLMaqIN7WHSD88PBA/exec";

		$.get(picks_url, function(data){
			var picks = JSON.parse(data);

			$.each(picks, function(k,v){

				$('#UFC_bets_info').append('<tr>\
					<td>'+eval(k+1)+'</td>\
					<td><a href="https://explorer.wagerr.com/#/bet/event/'+v.eventId+'">'+v.eventId+'</a></td>\
					<td>'+v.date.split(".")[0]+'</td>\
					<td>'+v.home+'</td>\
					<td>'+v.away+'</td>\
					<td class="table-pick">'+v.pick+'</td>\
					<td class="table-pick">'+v.how+'</td>\
					<td class="table_'+ v.confidence.split(' ')[0]+'">'+v.confidence+'</td>\
				</tr>');

			});

		})
	}

	

	//donate button copy
	function donate_copy(){
			var copyText = document.getElementById("donate_input");
			//select field
			copyText.select();

			//for mobile
			copyText.setSelectionRange(0, 99999);

			//copy text
			document.execCommand('copy');

			alert("Copied the text: " + copyText.value);
	}

	//donation button copy
	$(document).on('click', '#donate_button', function(){
		donate_copy();

	});
	
});
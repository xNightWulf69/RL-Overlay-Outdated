		    const sleep = ms => new Promise(r => setTimeout(r, ms));
		    const WsSubscribers = {
		        __subscribers: {},
		        websocket: undefined,
		        webSocketConnected: false,
		        registerQueue: [],
		        init: function(port, debug, debugFilters) {
		            port = port || 49322;
		            debug = debug || false;
		            if (debug) {
		                if (debugFilters !== undefined) {
		                    console.warn("WebSocket Debug Mode enabled with filtering. Only events not in the filter list will be dumped");
		                } else {
		                    console.warn("WebSocket Debug Mode enabled without filters applied. All events will be dumped to console");
		                    console.warn("To use filters, pass in an array of 'channel:event' strings to the second parameter of the init function");
		                }
		            }
		            WsSubscribers.webSocket = new WebSocket("ws://localhost:" + port);
		            WsSubscribers.webSocket.onmessage = function(event) {
		                let jEvent = JSON.parse(event.data);
		                if (!jEvent.hasOwnProperty('event')) {
		                    return;
		                }
		                let eventSplit = jEvent.event.split(':');
		                let channel = eventSplit[0];
		                let event_event = eventSplit[1];
		                if (debug) {
		                    if (!debugFilters) {
		                        console.log(channel, event_event, jEvent);
		                    } else if (debugFilters && debugFilters.indexOf(jEvent.event) < 0) {
		                        console.log(channel, event_event, jEvent);
		                    }
		                }
		                WsSubscribers.triggerSubscribers(channel, event_event, jEvent.data);
		            };
		            WsSubscribers.webSocket.onopen = function() {
		                WsSubscribers.triggerSubscribers("ws", "open");
		                WsSubscribers.webSocketConnected = true;
		                WsSubscribers.registerQueue.forEach((r) => {
		                    WsSubscribers.send("wsRelay", "register", r);
		                });
		                WsSubscribers.registerQueue = [];
		            };
		            WsSubscribers.webSocket.onerror = function() {
		                WsSubscribers.triggerSubscribers("ws", "error");
		                WsSubscribers.webSocketConnected = false;
		            };
		            WsSubscribers.webSocket.onclose = function() {
		                WsSubscribers.triggerSubscribers("ws", "close");
		                WsSubscribers.webSocketConnected = false;
		            };
		        },
		        /**
		         * Add callbacks for when certain events are thrown
		         * Execution is guaranteed to be in First In First Out order
		         * @param channels
		         * @param events
		         * @param callback
		         */
		        subscribe: function(channels, events, callback) {
		            if (typeof channels === "string") {
		                let channel = channels;
		                channels = [];
		                channels.push(channel);
		            }
		            if (typeof events === "string") {
		                let event = events;
		                events = [];
		                events.push(event);
		            }
		            channels.forEach(function(c) {
		                events.forEach(function(e) {
		                    if (!WsSubscribers.__subscribers.hasOwnProperty(c)) {
		                        WsSubscribers.__subscribers[c] = {};
		                    }
		                    if (!WsSubscribers.__subscribers[c].hasOwnProperty(e)) {
		                        WsSubscribers.__subscribers[c][e] = [];
		                        if (WsSubscribers.webSocketConnected) {
		                            WsSubscribers.send("wsRelay", "register", `${c}:${e}`);
		                        } else {
		                            WsSubscribers.registerQueue.push(`${c}:${e}`);
		                        }
		                    }
		                    WsSubscribers.__subscribers[c][e].push(callback);
		                });
		            })
		        },
		        clearEventCallbacks: function(channel, event) {
		            if (WsSubscribers.__subscribers.hasOwnProperty(channel) && WsSubscribers.__subscribers[channel].hasOwnProperty(event)) {
		                WsSubscribers.__subscribers[channel] = {};
		            }
		        },
		        triggerSubscribers: function(channel, event, data) {
		            if (WsSubscribers.__subscribers.hasOwnProperty(channel) && WsSubscribers.__subscribers[channel].hasOwnProperty(event)) {
		                WsSubscribers.__subscribers[channel][event].forEach(function(callback) {
		                    if (callback instanceof Function) {
		                        callback(data);
		                    }
		                });
		            }
		        },
		        send: function(channel, event, data) {
		            if (typeof channel !== 'string') {
		                console.error("Channel must be a string");
		                return;
		            }
		            if (typeof event !== 'string') {
		                console.error("Event must be a string");
		                return;
		            }
		            if (channel === 'local') {
		                this.triggerSubscribers(channel, event, data);
		            } else {
		                let cEvent = channel + ":" + event;
		                WsSubscribers.webSocket.send(JSON.stringify({
		                    'event': cEvent,
		                    'data': data
		                }));
		            }
		        }
		    };
		    ///

		    $(() => {
		        WsSubscribers.init(49322, true);
		        WsSubscribers.subscribe("game", "update_state", (d) => {
					$('.scorebugleft').css('visibility', 'visible')
					$('.scorebugright').css('visibility', 'visible')
					$('.timer').css('visibility', 'visible')
					$('.orangescore').css('visibility', 'visible')
					$('.orangescorenumber').css('visibility', 'visible')
					$('.bluescore').css('visibility', 'visible')
					$('.bluescorenumber').css('visibility', 'visible')
					$('.orangename').css('visibility', 'visible')
					$('.bluename').css('visibility', 'visible')
		            $(".bluescorenumber").text(d['game']['teams'][0]['score']);
		            $(".orangescorenumber").text(d['game']['teams'][1]['score']);
		            var time = (d['game']['time_seconds'])
		            var round = Math.ceil(time)

		            function myTime(time) {

		                var min = ~~((time % 3600) / 60);
		                var sec = time % 60;
		                var sec_min = "";
		                sec_min += "" + min + ":" + (sec < 10 ? "0" : "");
		                sec_min += "" + sec;
		                return sec_min;
		            }
		            $(".timer").text(myTime(round))
		            var blueName = (d['game']['teams'][0]['name'])
		            var orangeName = (d['game']['teams'][1]['name'])
		            var blueColor = '#' + (d['game']['teams'][0]['color_primary'])
		            var orangeColor = '#' + (d['game']['teams'][1]['color_primary'])
		            var bluebordColor = '10px solid #' + (d['game']['teams'][0]['color_primary'])
		            var orangebordColor = '10px solid #' + (d['game']['teams'][1]['color_primary'])
		            var blueboxColor = '-5px 5px 20px 0px #' + (d['game']['teams'][0]['color_primary'])
		            var orangeboxColor = '5px 5px 20px 0px #' + (d['game']['teams'][1]['color_primary'])
					var boxshadowblue = 'inset -95px -13px 80px -17px #' + (d['game']['teams'][0]['color_secondary'])
					var boxshadoworange = 'inset -95px -13px 80px -17px #' + (d['game']['teams'][1]['color_secondary'])
					var blueborderbottom = '10px solid #' + (d['game']['teams'][0]['color_primary'])
					var orangeborderbottom = '10px solid #' + (d['game']['teams'][1]['color_primary'])
					if (blueName == "PEAK LEVEL ESP") {
                        var blueName = "PEAK LEVEL ESPORTS"
						$(".bluename").css('width', '410px')
						$(".bluename").css('top', '35px')
						$(".bluename").css('left', '397px')
						$(".bluename").css('font-size', '30px')
					}
		            $(".bluename").text(blueName);
		            $(".orangename").text(orangeName);
		            $(".bluename").css('color', blueColor);
		            $(".orangename").css('color', orangeColor);
		            $(".bluescore").css('background-color', blueColor);
		            $(".orangescore").css('background-color', orangeColor);
		            $(".scorebugleft").css('border-bottom', bluebordColor);
		            $(".scorebugright").css('border-bottom', orangebordColor);
		            $(".scorebugleft").css('border-left', bluebordColor);
		            $(".scorebugright").css('border-right', orangebordColor);
		            $(".scorebugleft").css('border-top', bluebordColor);
		            $(".scorebugright").css('border-top', orangebordColor);
		            $(".scorebugleft").css('box-shadow', blueboxColor);
		            $(".scorebugright").css('box-shadow', orangeboxColor);
					$(".scorebugleftanim, .scorebugleftgoal, .scorebugleftgoalback").css('background-color', blueColor);
					$(".scorebugrightanim, .scorebugrightgoal, .scorebugrightgoalback").css('background-color', orangeColor);
					$(".scorebugleftanim, .scorebugleftgoal, .scorebugleftgoalback").css('border-bottom', blueborderbottom);
					$(".scorebugrightanim, .scorebugrightgoal, .scorebugrightgoalback").css('border-bottom', orangeborderbottom);
		            $("#blue-player-1-p-bar, #blue-player-2-p-bar, #blue-player-3-p-bar, .blue-active-p-bar, .blueactivecontainer, .blue-active-boost").css('background-color', blueColor);
		            $('.goalimage').css('background-image', 'goal.png')
		            var bordercolorb = '5px solid #' + (d['game']['teams'][0]['color_primary'])
		            var bordercoloro = '5px solid #' + (d['game']['teams'][1]['color_primary'])
		            $('#toast-container > .toast-success').css('border', bordercolorb)
		            $('#toast-container > .toast-warning').css('border', bordercoloro)
		            $("#orange-player-1-p-bar, #orange-player-2-p-bar, #orange-player-3-p-bar, .orange-active-p-bar, .orangeactivecontainer, .orange-active-boost").css('background-color', orangeColor);
		            if ((d['game']['isOT']) == false) {
		                $('.overtime').removeClass('overtime')
		                $('.overtime').text('')
		            } else {
		                $('.overtime').addClass('overtime')
		                $('.overtime').text('Overtime')
		            }
					if (orangeColor != "#262626") {
						$(".orangename").css('color', orangeColor)
					} 
					if (orangeColor != "#e5e5e5") {
						$(".orangescorenumber").css('color', 'white')
					} 
					if (orangeColor == "#e5e5e5") {
						$(".orangescorenumber").css('color', 'black')
					} 
					if (orangeColor == "#262626") {
						$(".orangename").css('color', 'white')
					}
					if (blueColor != "#262626") {
						$(".bluename").css('color', blueColor)
					} 
					if (blueColor == "#262626") {
						$(".bluename").css('color', 'white')
					} 
		            var activeTarget = (d['game']['target'])
		            var players = (d['players'])
		            let activePlayerData = d.players[d.game.target];


		            if (activeTarget.length > 1) {


		                if (activePlayerData.team == 0) {
		                    $('.blue-team-active').css('visibility', 'visible')
		                    $('.orange-team-active').css('visibility', 'hidden')
		                    $('.orange-active-p-bar').css('visibility', 'hidden')
		                    $('.blue-active-p-bar').css('visibility', 'visible')
							$('.blue-active-name').css('visibility', 'visible')
							$('.orange-active-name').css('visibility', 'hidden')
							$('.blueactiveboostcontainer').css('visibility', 'visible')
							$('.orangeactiveboostcontainer').css('visibility', 'hidden')
							$('.blueactivecontainer').css('visibility', 'visible')
							$('.orangeactivecontainer').css('visibility', 'hidden')
		                    $('.blue-active-name').text(activePlayerData.name)
		                    $('.blue-active-goals').text(activePlayerData.goals)
		                    $('.blue-active-demos').text(activePlayerData.demos)
		                    $('.blue-active-shots').text(activePlayerData.shots)
		                    $('.blue-active-saves').text(activePlayerData.saves)
		                    $('.blue-active-assists').text(activePlayerData.assists)
		                    $('.blue-active-boost').width(activePlayerData.boost + "%")
		                    $('.blue-active-boostnumber').text(activePlayerData.boost + "%")


		                } else if (activePlayerData.team == 1) {
		                    $('.blue-team-active').css('visibility', 'hidden')
		                    $('.orange-team-active').css('visibility', 'visible')
		                    $('.blue-active-p-bar').css('visibility', 'hidden')
		                    $('.orange-active-name').css('visibility', 'visible')
							$('.orange-active-name').css('visibility', 'visible')
							$('.blue-active-name').css('visibility', 'hidden')
							$('.orangeactiveboostcontainer').css('visibility', 'visible')
							$('.blueactiveboostcontainer').css('visibility', 'hidden')
							$('.blueactivecontainer').css('visibility', 'hidden')
							$('.orangeactivecontainer').css('visibility', 'visible')
		                    $('.orange-active-name').text(activePlayerData.name)
		                    $('.orange-active-goals').text(activePlayerData.goals)
		                    $('.orange-active-demos').text(activePlayerData.demos)
		                    $('.orange-active-shots').text(activePlayerData.shots)
		                    $('.orange-active-saves').text(activePlayerData.saves)
		                    $('.orange-active-assists').text(activePlayerData.assists)
		                    $('.orange-active-boost').text(activePlayerData.boost)
		                    $('.orange-active-boost').width(activePlayerData.boost + "%")
							$('.orange-active-boostnumber').text(activePlayerData.boost + "%")

		                } else {
		                    $('.blue-team-active').css('visibility', 'hidden')
		                    $('.orange-team-active').css('visibility', 'hidden')
		                    $('.orange-active-p-bar').css('visibility', 'hidden')
		                    $('.blue-active-p-bar').css('visibility', 'hidden')
							$('.blue-active-name').css('visibility', 'hidden')
							$('.orange-active-name').css('visibility', 'hidden')
							$('.blueactiveboostcontainer').css('visibility', 'hidden')
							$('.orangeactiveboostcontainer').css('visibility', 'hidden')
							$('.blueactivecontainer').css('visibility', 'hidden')
							$('.orangeactivecontainer').css('visibility', 'hidden')
		                }

		            } else {
		                    $('.blue-team-active').css('visibility', 'hidden')
		                    $('.orange-team-active').css('visibility', 'hidden')
		                    $('.orange-active-p-bar').css('visibility', 'hidden')
		                    $('.blue-active-p-bar').css('visibility', 'hidden')
							$('.blue-active-name').css('visibility', 'hidden')
							$('.orange-active-name').css('visibility', 'hidden')
							$('.blueactiveboostcontainer').css('visibility', 'hidden')
							$('.orangeactiveboostcontainer').css('visibility', 'hidden')
							$('.blueactivecontainer').css('visibility', 'hidden')
							$('.orangeactivecontainer').css('visibility', 'hidden')
		            }
		            let team0 = {};
		            let team1 = {};

		            Object.keys(d['players']).forEach((id) => {
		                if (d['players'][id].team == 0) {
		                    team0 = {...team0,
		                        [id]: {...d['players'][id]
		                        }
		                    };
		                } else {
		                    team1 = {...team1,
		                        [id]: {...d['players'][id]
		                        }
		                    };
		                }
		            });
		            if (d['players'][Object.keys(team0)[0]] != undefined) {
		                $('#blue-player-3-name').text(d['players'][Object.keys(team0)[0]]['name'])
		                $('.blue-player-3-goals').text(d['players'][Object.keys(team0)[0]]['goals'])
		                $('.blue-player-3-assists').text(d['players'][Object.keys(team0)[0]]['assists'])
		                $('.blue-player-3-saves').text(d['players'][Object.keys(team0)[0]]['saves'])
		                $('.blue-player-3-shots').text(d['players'][Object.keys(team0)[0]]['shots'])
		                $('#blue-player-3-p-bar').text(d['players'][Object.keys(team0)[0]]['boost'] + "%")
		                $('#blue-player-3-p-bar').width(d['players'][Object.keys(team0)[0]]['boost'] + "%")
		                $('#blue-player-3').css('visibility', 'visible')
		                $('.bp3').css('visibility', 'visible')
		                $('#bluep3').css('visibility', 'visible')
		            } else {
		                [].forEach.call(document.querySelectorAll('#blue-player-3'), function(el) {
		                    el.style.visibility = 'hidden';
		                });
		                [].forEach.call(document.querySelectorAll('.bp3'), function(el) {
		                    el.style.visibility = 'hidden';
		                });
		                [].forEach.call(document.querySelectorAll('#bluep3'), function(el) {
		                    el.style.visibility = 'hidden';
		                });
		            }

		            if (d['players'][Object.keys(team0)[1]] != undefined) {
		                $('#blue-player-2-name').text(d['players'][Object.keys(team0)[1]]['name'])
		                $('.blue-player-2-goals').text(d['players'][Object.keys(team0)[1]]['goals'])
		                $('.blue-player-2-assists').text(d['players'][Object.keys(team0)[1]]['assists'])
		                $('.blue-player-2-saves').text(d['players'][Object.keys(team0)[1]]['saves'])
		                $('.blue-player-2-shots').text(d['players'][Object.keys(team0)[1]]['shots'])
		                $('#blue-player-2-p-bar').text(d['players'][Object.keys(team0)[1]]['boost'] + "%")
		                $('#blue-player-2-p-bar').width(d['players'][Object.keys(team0)[1]]['boost'] + "%")
		                $('#blue-player-2').css('visibility', 'visible')
		                $('.bp2').css('visibility', 'visible')
		                $('#bluep2').css('visibility', 'visible')
		            } else {
		                [].forEach.call(document.querySelectorAll('#blue-player-2'), function(el) {
		                    el.style.visibility = 'hidden';
		                });
		                [].forEach.call(document.querySelectorAll('.bp2'), function(el) {
		                    el.style.visibility = 'hidden';
		                });
		                [].forEach.call(document.querySelectorAll('#bluep2'), function(el) {
		                    el.style.visibility = 'hidden';
		                });
		            }

		            if (d['players'][Object.keys(team0)[2]] != undefined) {
		                $('#blue-player-1-name').text(d['players'][Object.keys(team0)[2]]['name'])
		                $('.blue-player-1-goals').text(d['players'][Object.keys(team0)[2]]['goals'])
		                $('.blue-player-1-assists').text(d['players'][Object.keys(team0)[2]]['assists'])
		                $('.blue-player-1-saves').text(d['players'][Object.keys(team0)[2]]['saves'])
		                $('.blue-player-1-shots').text(d['players'][Object.keys(team0)[2]]['shots'])
		                $('#blue-player-1-p-bar').text(d['players'][Object.keys(team0)[2]]['boost'] + "%")
		                $('#blue-player-1-p-bar').width(d['players'][Object.keys(team0)[2]]['boost'] + "%")
		                $('#blue-player-1').css('visibility', 'visible')
		                $('.bp1').css('visibility', 'visible')
		                $('#bluep1').css('visibility', 'visible')
		            } else {
		                [].forEach.call(document.querySelectorAll('#blue-player-1'), function(el) {
		                    el.style.visibility = 'hidden';
		                });
		                [].forEach.call(document.querySelectorAll('.bp1'), function(el) {
		                    el.style.visibility = 'hidden';
		                });
		                [].forEach.call(document.querySelectorAll('#bluep1'), function(el) {
		                    el.style.visibility = 'hidden';
		                });
		            }

		            if (d['players'][Object.keys(team1)[0]] != undefined) {
		                $('#orange-player-3-name').text(d['players'][Object.keys(team1)[0]]['name'])
		                $('.orange-player-3-goals').text(d['players'][Object.keys(team1)[0]]['goals'])
		                $('.orange-player-3-assists').text(d['players'][Object.keys(team1)[0]]['assists'])
		                $('.orange-player-3-saves').text(d['players'][Object.keys(team1)[0]]['saves'])
		                $('.orange-player-3-shots').text(d['players'][Object.keys(team1)[0]]['shots'])
		                $('#orange-player-3-p-bar').text(d['players'][Object.keys(team1)[0]]['boost'] + "%")
		                $('#orange-player-3-p-bar').width(d['players'][Object.keys(team1)[0]]['boost'] + "%")
		                $('#orange-player-3').css('visibility', 'visible')
		                $('.op3').css('visibility', 'visible')
		                $('#orangep3').css('visibility', 'visible')
		            } else {
		                [].forEach.call(document.querySelectorAll('#orange-player-3'), function(el) {
		                    el.style.visibility = 'hidden';
		                });
		                [].forEach.call(document.querySelectorAll('.op3'), function(el) {
		                    el.style.visibility = 'hidden';
		                });
		                [].forEach.call(document.querySelectorAll('#orangep3'), function(el) {
		                    el.style.visibility = 'hidden';
		                });
		            }

		            if (d['players'][Object.keys(team1)[1]] != undefined) {
		                $('#orange-player-2-name').text(d['players'][Object.keys(team1)[1]]['name'])
		                $('.orange-player-2-goals').text(d['players'][Object.keys(team1)[1]]['goals'])
		                $('.orange-player-2-assists').text(d['players'][Object.keys(team1)[1]]['assists'])
		                $('.orange-player-2-saves').text(d['players'][Object.keys(team1)[1]]['saves'])
		                $('.orange-player-2-shots').text(d['players'][Object.keys(team1)[1]]['shots'])
		                $('#orange-player-2-p-bar').text(d['players'][Object.keys(team1)[1]]['boost'] + "%")
		                $('#orange-player-2-p-bar').width(d['players'][Object.keys(team1)[1]]['boost'] + "%")
		                $('#orange-player-2').css('visibility', 'visible')
		                $('.op2').css('visibility', 'visible')
		                $('#orangep2').css('visibility', 'visible')
		            } else {
		                $('#orange-player-2').css('visibility', 'hidden')
		                $('.op2').css('visibility', 'hidden')
		                $('#orangep2').css('visibility', 'hidden')
		            }

		            if (d['players'][Object.keys(team1)[2]] != undefined) {
		                $('#orange-player-1-name').text(d['players'][Object.keys(team1)[2]]['name'])
		                $('.orange-player-1-goals').text(d['players'][Object.keys(team1)[2]]['goals'])
		                $('.orange-player-1-assists').text(d['players'][Object.keys(team1)[2]]['assists'])
		                $('.orange-player-1-saves').text(d['players'][Object.keys(team1)[2]]['saves'])
		                $('.orange-player-1-shots').text(d['players'][Object.keys(team1)[2]]['shots'])
		                $('#orange-player-1-p-bar').text(d['players'][Object.keys(team1)[2]]['boost'] + "%")
		                $('#orange-player-1-p-bar').width(d['players'][Object.keys(team1)[2]]['boost'] + "%")
		                $('#orange-player-1').css('visibility', 'visible')
		                $('.op1').css('visibility', 'visible')
		                $('#orangep1').css('visibility', 'visible')
		            } else {
		                $('#orange-player-1').css('visibility',  'hidden')
		                $('.op1').css('visibility', 'hidden')
		                $('#orangep1').css('visibility', 'hidden')
		            }

		            if (d['game']['isReplay'] == false) {
		                $('.replay').css('visibility', 'hidden')
		                $('.replaybox, .replayboxactive, .replayactivecontainer').css('visibility', 'hidden')
		            } else {
		                $('.replay').css('visibility', 'visible')
		                $('.replaybox, .replayboxactive, .replayactivecontainer').css('visibility', 'visible')
		                $('.blue-team-active').css('visibility', 'hidden')
		                $('.orange-team-active').css('visibility', 'hidden')
		                $('.orange-active-p-bar').css('visibility', 'hidden')
		                $('.blue-active-p-bar').css('visibility', 'hidden')
					    $('.blue-active-name').css('visibility', 'hidden')
						$('.orange-active-name').css('visibility', 'hidden')
						$('.blueactiveboostcontainer').css('visibility', 'hidden')
						$('.orangeactiveboostcontainer').css('visibility', 'hidden')
						$('.blueactivecontainer').css('visibility', 'hidden')
						$('.orangeactivecontainer').css('visibility', 'hidden')
		                $('#orange-player-1, #orange-player-2, #orange-player-3').css('visibility', 'hidden')
		                $('.op1, .op2, .op3').css('visibility', 'hidden')
		                $('#orangep1, #orangep2, #orangep3').css('visibility', 'hidden')
		                $('#blue-player-1, #blue-player-2, #blue-player-3').css('visibility', 'hidden')
		                $('.bp1, .bp2, .bp3').css('visibility', 'hidden')
		                $('#bluep1, #bluep2, #bluep3').css('visibility', 'hidden')
		                var vid = document.getElementById("myVideo");
		                vid.play();
						if (d['game']['time_milliseconds'] == 300 && d['game']['time_seconds'] == 0) {
							$('.replaybox, .replayboxactive, .replayactivecontainer').css('visibility', 'hidden')
						}
		            }
		        });
		        WsSubscribers.subscribe("game", "statfeed_event", (data) => {
		            var event_type = (data['event_name'])
		            var event_user = (data['main_target']['name'])
		            var event_user1 = (data['secondary_target']['name'])
		            var event = event_user + " - " + event_type
		            if (data['main_target']['team_num'] == 0) {
		                async function goal() {
		                    if (data['event_name'] == "Goal") {
		                        toastr.success('', event_user, {
		                            id: 'goalblue',
		                            newestOnTop: false,
		                            timeOut: 5000,
		                            preventDuplicates: false,
		                        })
		                    }
		                    await sleep(10);
		                }
		                goal();
		                async function shot() {
		                    if (data['event_name'] == "Shot") {
		                        toastr.success('', event_user, {
		                            id: 'shotblue',
		                            newestOnTop: false,
		                            timeOut: 5000,
		                            preventDuplicates: false,
		                        })
		                    }
		                    await sleep(10);
		                }
		                shot();
		                async function assist() {
		                    if (data['event_name'] == "Assist") {
		                        toastr.success('', event_user, {
		                            id: 'assistblue',
		                            newestOnTop: false,
		                            timeOut: 5000,
		                            preventDuplicates: false,
		                        })
		                    }
		                    await sleep(10);
		                }
		                assist();
		                async function save() {
		                    if (data['event_name'] == "Save") {
		                        toastr.success('', event_user, {
		                            id: 'saveblue',
		                            newestOnTop: false,
		                            timeOut: 5000,
		                            preventDuplicates: false,
		                        })
		                    }
		                    await sleep(10);
		                }
		                save();
		                async function demolish() {
		                    if (data['event_name'] == "Demolish") {
		                        toastr.success('', event_user1, {
		                            id: 'demoblue',
		                            newestOnTop: false,
		                            timeOut: 5000,
		                            preventDuplicates: false,
		                        })
		                    }
		                    await sleep(10);
		                }
		                demolish();
		                async function overtimegoal() {
		                    if (data['event_name'] == "OvertimeGoal") {
		                        toastr.success('', event_user, {
		                            id: 'overtimeblue',
		                            newestOnTop: false,
		                            timeOut: 5000,
		                            preventDuplicates: false,
		                        })
		                    }
		                    await sleep(10);
		                }
		                overtimegoal();
		                async function aerialgoal() {
		                    if (data['event_name'] == "AerialGoal") {
		                        toastr.success('', event_user, {
		                            id: 'aerialblue',
		                            newestOnTop: false,
		                            timeOut: 5000,
		                            preventDuplicates: false,
		                        })
		                    }
		                    await sleep(10);
		                }
		                aerialgoal();
		                async function backwardsgoal() {
		                    if (data['event_name'] == "BackwardsGoal") {
		                        toastr.success('', event_user, {
		                            id: 'backwardsblue',
		                            newestOnTop: false,
		                            timeOut: 5000,
		                            preventDuplicates: false,
		                        })
		                    }
		                    await sleep(10);
		                }
		                backwardsgoal();
		                async function bicyclegoal() {
		                    if (data['event_name'] == "BicycleGoal") {
		                        toastr.success('', event_user, {
		                            id: 'bicycleblue',
		                            newestOnTop: false,
		                            timeOut: 5000,
		                            preventDuplicates: false,
		                        })
		                    }
		                    await sleep(10);
		                }
		                bicyclegoal();
		                async function longgoal() {
		                    if (data['event_name'] == "LongGoal") {
		                        toastr.success('', event_user, {
		                            id: 'longblue',
		                            newestOnTop: false,
		                            timeOut: 5000,
		                            preventDuplicates: false,
		                        })
		                    }
		                    await sleep(10);
		                }
		                longgoal();
		                async function turtlegoal() {
		                    if (data['event_name'] == "TurtleGoal") {
		                        toastr.success('', event_user, {
		                            id: 'turtleblue',
		                            newestOnTop: false,
		                            timeOut: 5000,
		                            preventDuplicates: false,
		                        })
		                    }
		                    await sleep(10);
		                }
		                turtlegoal();
		                async function hoopsswishgoal() {
		                    if (data['event_name'] == "HoopsSwishGoal") {
		                        toastr.success('', event_user, {
		                            id: 'swishblue',
		                            newestOnTop: false,
		                            timeOut: 5000,
		                            preventDuplicates: false,
		                        })
		                    }
		                    await sleep(10);
		                }
		                hoopsswishgoal();
		                async function playmaker() {
		                    if (data['event_name'] == "Playmaker") {
		                        toastr.success('', event_user, {
		                            id: 'playmakerblue',
		                            newestOnTop: false,
		                            timeOut: 5000,
		                            preventDuplicates: false,
		                        })
		                    }
		                    await sleep(10);
		                }
		                playmaker();
		                async function epicsave() {
		                    if (data['event_name'] == "EpicSave") {
		                        toastr.success('', event_user, {
		                            id: 'epicblue',
		                            newestOnTop: false,
		                            timeOut: 5000,
		                            preventDuplicates: false,
		                        })
		                    }
		                    await sleep(10);
		                }
		                epicsave();
		                async function savior() {
		                    if (data['event_name'] == "Savior") {
		                        toastr.success('', event_user, {
		                            id: 'saviorblue',
		                            newestOnTop: false,
		                            timeOut: 5000,
		                            preventDuplicates: false,
		                        })
		                    }
		                    await sleep(10);
		                }
		                savior();
		                async function poolshot() {
		                    if (data['event_name'] == "PoolShot") {
		                        toastr.success('', event_user, {
		                            id: 'poolblue',
		                            newestOnTop: false,
		                            timeOut: 5000,
		                            preventDuplicates: false,
		                        })
		                    }
		                    await sleep(10);
		                }
		                poolshot();
		                async function demolition() {
		                    if (data['event_name'] == "Demolition") {
		                        toastr.success('', event_user, {
		                            id: 'extermblue',
		                            newestOnTop: false,
		                            timeOut: 5000,
		                            preventDuplicates: false,
		                        })
		                    }
		                    await sleep(10);
		                }
		                demolition();
		                async function breakoutdamage() {
		                    if (data['event_name'] == "BreakoutDamage") {
		                        toastr.success('', event_user, {
		                            id: 'damageblue',
		                            newestOnTop: false,
		                            timeOut: 5000,
		                            preventDuplicates: false,
		                        })
		                    }
		                    await sleep(10);
		                }
		                breakoutdamage();
		                async function breakoutdamagelarge() {
		                    if (data['event_name'] == "BreakoutDamageLarge") {
		                        toastr.success('', event_user, {
		                            id: 'ultrablue',
		                            newestOnTop: false,
		                            timeOut: 5000,
		                            preventDuplicates: false,
		                        })
		                    }
		                    await sleep(10);
		                }
		                breakoutdamagelarge();
		                async function hattrick() {
		                    if (data['event_name'] == "HatTrick") {
		                        toastr.success('', event_user, {
		                            id: 'hatblue',
		                            newestOnTop: false,
		                            timeOut: 5000,
		                            preventDuplicates: false,
		                        })
		                    }
		                    await sleep(10);
		                }
		                hattrick();
		                async function highfive() {
		                    if (data['event_name'] == "HighFive") {
		                        toastr.success('', event_user, {
		                            id: 'highblue',
		                            newestOnTop: false,
		                            timeOut: 5000,
		                            preventDuplicates: false,
		                        })
		                    }
		                    await sleep(10);
		                }
		                highfive();
		                async function lowfive() {
		                    if (data['event_name'] == "LowFive") {
		                        toastr.success('', event_user, {
		                            id: 'lowblue',
		                            newestOnTop: false,
		                            timeOut: 5000,
		                            preventDuplicates: false,
		                        })
		                    }
		                    await sleep(10);
		                }
		                lowfive();
		            }
		            if (data['main_target']['team_num'] == 1) {
		                async function goal() {
		                    if (data['event_name'] == "Goal") {
		                        toastr.warning('', event_user, {
		                            id: 'goalorange',
		                            newestOnTop: false,
		                            timeOut: 5000,
		                            preventDuplicates: false,
		                        })
		                    }
		                    await sleep(10);
		                }
		                goal();
		                async function shot() {
		                    if (data['event_name'] == "Shot") {
		                        toastr.warning('', event_user, {
		                            id: 'shotorange',
		                            newestOnTop: false,
		                            timeOut: 5000,
		                            preventDuplicates: false,
		                        })
		                    }
		                    await sleep(10);
		                }
		                shot();
		                async function assist() {
		                    if (data['event_name'] == "Assist") {
		                        toastr.warning('', event_user, {
		                            id: 'assistorange',
		                            newestOnTop: false,
		                            timeOut: 5000,
		                            preventDuplicates: false,
		                        })
		                    }
		                    await sleep(10);
		                }
		                assist();
		                async function save() {
		                    if (data['event_name'] == "Save") {
		                        toastr.warning('', event_user, {
		                            id: 'saveorange',
		                            newestOnTop: false,
		                            timeOut: 5000,
		                            preventDuplicates: false,
		                        })
		                    }
		                    await sleep(10);
		                }
		                save();
		                async function demolish() {
		                    if (data['event_name'] == "Demolish") {
		                        toastr.warning('', event_user1, {
		                            id: 'demoorange',
		                            newestOnTop: false,
		                            timeOut: 5000,
		                            preventDuplicates: false,
		                        })
		                    }
		                    await sleep(10);
		                }
		                demolish();
		                async function overtimegoal() {
		                    if (data['event_name'] == "OvertimeGoal") {
		                        toastr.warning('', event_user, {
		                            id: 'overtimeorange',
		                            newestOnTop: false,
		                            timeOut: 5000,
		                            preventDuplicates: false,
		                        })
		                    }
		                    await sleep(10);
		                }
		                overtimegoal();
		                async function aerialgoal() {
		                    if (data['event_name'] == "AerialGoal") {
		                        toastr.warning('', event_user, {
		                            id: 'aerialorange',
		                            newestOnTop: false,
		                            timeOut: 5000,
		                            preventDuplicates: false,
		                        })
		                    }
		                    await sleep(10);
		                }
		                aerialgoal();
		                async function backwardsgoal() {
		                    if (data['event_name'] == "BackwardsGoal") {
		                        toastr.warning('', event_user, {
		                            id: 'backwardsorange',
		                            newestOnTop: false,
		                            timeOut: 5000,
		                            preventDuplicates: false,
		                        })
		                    }
		                    await sleep(10);
		                }
		                backwardsgoal();
		                async function bicyclegoal() {
		                    if (data['event_name'] == "BicycleGoal") {
		                        toastr.warning('', event_user, {
		                            id: 'bicycleorange',
		                            newestOnTop: false,
		                            timeOut: 5000,
		                            preventDuplicates: false,
		                        })
		                    }
		                    await sleep(10);
		                }
		                bicyclegoal();
		                async function longgoal() {
		                    if (data['event_name'] == "LongGoal") {
		                        toastr.warning('', event_user, {
		                            id: 'longorange',
		                            newestOnTop: false,
		                            timeOut: 5000,
		                            preventDuplicates: false,
		                        })
		                    }
		                    await sleep(10);
		                }
		                longgoal();
		                async function turtlegoal() {
		                    if (data['event_name'] == "TurtleGoal") {
		                        toastr.warning('', event_user, {
		                            id: 'turtleorange',
		                            newestOnTop: false,
		                            timeOut: 5000,
		                            preventDuplicates: false,
		                        })
		                    }
		                    await sleep(10);
		                }
		                turtlegoal();
		                async function hoopsswishgoal() {
		                    if (data['event_name'] == "HoopsSwishGoal") {
		                        toastr.warning('', event_user, {
		                            id: 'swishblue',
		                            newestOnTop: false,
		                            timeOut: 5000,
		                            preventDuplicates: false,
		                        })
		                    }
		                    await sleep(10);
		                }
		                hoopsswishgoal();
		                async function playmaker() {
		                    if (data['event_name'] == "Playmaker") {
		                        toastr.warning('', event_user, {
		                            id: 'playmakerorange',
		                            newestOnTop: false,
		                            timeOut: 5000,
		                            preventDuplicates: false,
		                        })
		                    }
		                    await sleep(10);
		                }
		                playmaker();
		                async function epicsave() {
		                    if (data['event_name'] == "EpicSave") {
		                        toastr.warning('', event_user, {
		                            id: 'epicorange',
		                            newestOnTop: false,
		                            timeOut: 5000,
		                            preventDuplicates: false,
		                        })
		                    }
		                    await sleep(10);
		                }
		                epicsave();
		                async function savior() {
		                    if (data['event_name'] == "Savior") {
		                        toastr.warning('', event_user, {
		                            id: 'saviororange',
		                            newestOnTop: false,
		                            timeOut: 5000,
		                            preventDuplicates: false,
		                        })
		                    }
		                    await sleep(10);
		                }
		                savior();
		                async function poolshot() {
		                    if (data['event_name'] == "PoolShot") {
		                        toastr.warning('', event_user, {
		                            id: 'poolorange',
		                            newestOnTop: false,
		                            timeOut: 5000,
		                            preventDuplicates: false,
		                        })
		                    }
		                    await sleep(10);
		                }
		                poolshot();
		                async function demolition() {
		                    if (data['event_name'] == "Demolition") {
		                        toastr.warning('', event_user, {
		                            id: 'extermorange',
		                            newestOnTop: false,
		                            timeOut: 5000,
		                            preventDuplicates: false,
		                        })
		                    }
		                    await sleep(10);
		                }
		                demolition();
		                async function breakoutdamage() {
		                    if (data['event_name'] == "BreakoutDamage") {
		                        toastr.warning('', event_user, {
		                            id: 'damageorange',
		                            newestOnTop: false,
		                            timeOut: 5000,
		                            preventDuplicates: false,
		                        })
		                    }
		                    await sleep(10);
		                }
		                breakoutdamage();
		                async function breakoutdamagelarge() {
		                    if (data['event_name'] == "BreakoutDamageLarge") {
		                        toastr.warning('', event_user, {
		                            id: 'ultraorange',
		                            newestOnTop: false,
		                            timeOut: 5000,
		                            preventDuplicates: false,
		                        })
		                    }
		                    await sleep(10);
		                }
		                breakoutdamagelarge();
		                async function hattrick() {
		                    if (data['event_name'] == "HatTrick") {
		                        toastr.warning('', event_user, {
		                            id: 'hatorange',
		                            newestOnTop: false,
		                            timeOut: 5000,
		                            preventDuplicates: false,
		                        })
		                    }
		                    await sleep(10);
		                }
		                hattrick();
		                async function highfive() {
		                    if (data['event_name'] == "HighFive") {
		                        toastr.warning('', event_user, {
		                            id: 'highorange',
		                            newestOnTop: false,
		                            timeOut: 5000,
		                            preventDuplicates: false,
		                        })
		                    }
		                    await sleep(10);
		                }
		                highfive();
		                async function lowfive() {
		                    if (data['event_name'] == "LowFive") {
		                        toastr.warning('', event_user, {
		                            id: 'loworange',
		                            newestOnTop: false,
		                            timeOut: 5000,
		                            preventDuplicates: false,
		                        })
		                    }
		                    await sleep(10);
		                }
		                lowfive();
		            }

		            function orangeResetAll() {

		                //$("div[id^='orange-player-']").text('')
		                $('#orange-team-name').text('')
		                $("#orange-player-1, #orange-player-2, #orange-player-1").addClass('d-none')
		                $('#orange-player-1-p-bar, #orange-player-2-p-bar, #orange-player-3-p-bar').width('0%')
		            }

		            function blueResetAll() {
		                //$("div[id^='blue-player-']").text('')
		                $('#blue-team-name').text('')
		                $("#blue-player-1, #blue-player-2, #blue-player-1").addClass('d-none')

		                $('#blue-player-1-p-bar, #blue-player-2-p-bar, #blue-player-3-p-bar').width('0%')
		            }
		        })
				WsSubscribers.subscribe("game", "update_state", (dater) => {
		        WsSubscribers.subscribe("game", "match_ended", (da) => {
		            function orangeResetAll() {
		                $('#orange-team-name').text('')
		                $("#orange-player-1, #orange-player-2, #orange-player-1").addClass('d-none')
		                $('#orange-player-1-p-bar, #orange-player-2-p-bar, #orange-player-3-p-bar').width('0%')
		            }

		            function blueResetAll() {
		                $('#blue-team-name').text('')
		                $("#blue-player-1, #blue-player-2, #blue-player-1").addClass('d-none')

		                $('#blue-player-1-p-bar, #blue-player-2-p-bar, #blue-player-3-p-bar').width('0%')
		            }
		            [].forEach.call(document.querySelectorAll('.orange-active-p-bar'), function(el) {
		                el.style.visibility = 'hidden';
		            });
		            [].forEach.call(document.querySelectorAll('.blue-active-p-bar'), function(el) {
		                el.style.visibility = 'hidden';
		            });
					[].forEach.call(document.querySelectorAll('body'), function(el) {
		                el.style.visibility = 'visible';
		            });
		            blueResetAll()
		            orangeResetAll()
						$('.blue-team-active').css('visibility', 'hidden')
		                $('.orange-team-active').css('visibility', 'hidden')
		                $('.orange-active-p-bar').css('visibility', 'hidden')
		                $('.blue-active-p-bar').css('visibility', 'hidden')
					    $('.blue-active-name').css('visibility', 'hidden')
						$('.orange-active-name').css('visibility', 'hidden')
						$('.blueactiveboostcontainer').css('visibility', 'hidden')
						$('.orangeactiveboostcontainer').css('visibility', 'hidden')
						$('.blueactivecontainer').css('visibility', 'hidden')
						$('.orangeactivecontainer').css('visibility', 'hidden')
		                $('#orange-player-1, #orange-player-2, #orange-player-3').css('visibility', 'hidden')
		                $('.op1, .op2, .op3').css('visibility', 'hidden')
		                $('#orangep1, #orangep2, #orangep3').css('visibility', 'hidden')
		                $('#blue-player-1, #blue-player-2, #blue-player-3').css('visibility', 'hidden')
		                $('.bp1, .bp2, .bp3').css('visibility', 'hidden')
		                $('#bluep1, #bluep2, #bluep3').css('visibility', 'hidden')
						$('.scorebugleft').css('visibility', 'hidden')
						$('.scorebugright').css('visibility', 'hidden')
						$('.timer').css('visibility', 'hidden')
						$('.orangescore').css('visibility', 'hidden')
						$('.orangescorenumber').css('visibility', 'hidden')
						$('.bluescore').css('visibility', 'hidden')
						$('.bluescorenumber').css('visibility', 'hidden')
						$('.orangename').css('visibility', 'hidden')
						$('.bluename').css('visibility', 'hidden')
		        })})
				WsSubscribers.subscribe("game", "update_state", (dater) => {
					WsSubscribers.subscribe("game", "match_destroyed", (da) => {
						function orangeResetAll() {
							$('#orange-team-name').text('')
							$("#orange-player-1, #orange-player-2, #orange-player-1").addClass('d-none')
							$('#orange-player-1-p-bar, #orange-player-2-p-bar, #orange-player-3-p-bar').width('0%')
						}
	
						function blueResetAll() {
							$('#blue-team-name').text('')
							$("#blue-player-1, #blue-player-2, #blue-player-1").addClass('d-none')
	
							$('#blue-player-1-p-bar, #blue-player-2-p-bar, #blue-player-3-p-bar').width('0%')
						}
						[].forEach.call(document.querySelectorAll('.orange-active-p-bar'), function(el) {
							el.style.visibility = 'hidden';
						});
						[].forEach.call(document.querySelectorAll('.blue-active-p-bar'), function(el) {
							el.style.visibility = 'hidden';
						});
						[].forEach.call(document.querySelectorAll('body'), function(el) {
							el.style.visibility = 'visible';
						});
						blueResetAll()
						orangeResetAll()
							$('.blue-team-active').css('visibility', 'hidden')
							$('.orange-team-active').css('visibility', 'hidden')
							$('.orange-active-p-bar').css('visibility', 'hidden')
							$('.blue-active-p-bar').css('visibility', 'hidden')
							$('.blue-active-name').css('visibility', 'hidden')
							$('.orange-active-name').css('visibility', 'hidden')
							$('.blueactiveboostcontainer').css('visibility', 'hidden')
							$('.orangeactiveboostcontainer').css('visibility', 'hidden')
							$('.blueactivecontainer').css('visibility', 'hidden')
							$('.orangeactivecontainer').css('visibility', 'hidden')
							$('#orange-player-1, #orange-player-2, #orange-player-3').css('visibility', 'hidden')
							$('.op1, .op2, .op3').css('visibility', 'hidden')
							$('#orangep1, #orangep2, #orangep3').css('visibility', 'hidden')
							$('#blue-player-1, #blue-player-2, #blue-player-3').css('visibility', 'hidden')
							$('.bp1, .bp2, .bp3').css('visibility', 'hidden')
							$('#bluep1, #bluep2, #bluep3').css('visibility', 'hidden')
							$('.scorebugleft').css('visibility', 'hidden')
							$('.scorebugright').css('visibility', 'hidden')
							$('.timer').css('visibility', 'hidden')
							$('.orangescore').css('visibility', 'hidden')
							$('.orangescorenumber').css('visibility', 'hidden')
							$('.bluescore').css('visibility', 'hidden')
							$('.bluescorenumber').css('visibility', 'hidden')
							$('.orangename').css('visibility', 'hidden')
							$('.bluename').css('visibility', 'hidden')
					})})
		        WsSubscribers.subscribe("game", "post_countdown_begin", (da) => {
		            function orangeResetAll() {
		                $('#orange-team-name').text('')
		                $("#orange-player-1, #orange-player-2, #orange-player-1").addClass('d-none')
		                $('#orange-player-1-p-bar, #orange-player-2-p-bar, #orange-player-3-p-bar').width('0%')
		            }
		            function blueResetAll() {
		                $('#blue-team-name').text('')
		                $("#blue-player-1, #blue-player-2, #blue-player-1").addClass('d-none')

		                $('#blue-player-1-p-bar, #blue-player-2-p-bar, #blue-player-3-p-bar').width('0%')
		            }
		            [].forEach.call(document.querySelectorAll('body'), function(el) {
		                el.style.visibility = 'visible';
		            });
		            blueResetAll()
		            orangeResetAll()
		        })
		        WsSubscribers.subscribe("game", "replay_start", (da) => {
                    $('#scorebugleftanim').removeClass('scorebugleftgoalback');
					$('#scorebugrightanim').removeClass('scorebugrightgoalback');
		        })
		        WsSubscribers.subscribe("game", "update_state", (dat) => {
		            WsSubscribers.subscribe("game", "goal_scored", (date) => {
						var blue = (dat['game']['teams'][0]['color_primary'])
						var orange = (dat['game']['teams'][1]['color_primary'])


						async function animblue() {
							setTimeout(
							function () {
						$('#scorebugleftanim').addClass('scorebugleftgoal');
						}, 8000);
					    }
						async function animorange() {
							setTimeout(
							function () {
						$('#scorebugrightanim').addClass('scorebugrightgoal');
						}, 8000);
					    }


						async function animbackblue() {
							setTimeout(
							function () {
						$('#scorebugleftanim').addClass('scorebugleftgoalback');
						}, 9000);
					    }
						async function animbackorange() {
							setTimeout(
							function () {
						$('#scorebugrightanim').addClass('scorebugrightgoalback');
						}, 9000);
					    }


						async function animbackblueremove() {
							setTimeout(
							function () {
						$('#scorebugleftanim').removeClass('scorebugleftgoalback');
						}, 10000);
					    }
						async function animbackorangeremove() {
							setTimeout(
							function () {
						$('#scorebugrightanim').removeClass('scorebugrightgoalback');
						}, 10000);
					    }
						

						async function animblueremove() {
							setTimeout(
							function () {
						$('#scorebugleftanim').removeClass('scorebugleftgoal');
						}, 9000);
					    }
						async function animorangeremove() {
							setTimeout(
							function () {
						$('#scorebugrightanim').removeClass('scorebugrightgoal');
						}, 9000);
					    }

                        var scorer = (date['scorer']['name'])
						if (date['scorer']['teamnum'] == 0) {
						    $('#scorebugleftanim').addClass('scorebugleftgoal');
							animblue();
							animbackblue();
							animblueremove();
							animbackblueremove();
						} 
						if (date['scorer']['teamnum'] == 1) {
						    $('#scorebugrightanim').addClass('scorebugrightgoal');
							animorange();
							animbackorange();
							animorangeremove();
							animbackorangeremove();
						}
						if (date['assister']['name'] != "") {
						    var assister = (date['assister']['name'])
							$('.assisterimage').css('background-image', 'url(https://static.wikia.nocookie.net/rocketleague/images/8/8e/Assist_points_icon.png)')
						} else {
							var assister = ("")
							$('.assisterimage').css('background-image', 'none')
						}
		                var ballspeed = (Math.round(date['goalspeed']) + " KMH")
						var mph = (Math.round(dat['game']['ball']['speed'] / 1.609))
						var ballspeedmph = (mph + " MPH" )
					    if (date['scorer']['teamnum'] == 0) {
						$('.replayactivecontainer').css('background-color', blue)
					    } else {
						    $('.replayactivecontainer').css('background-color', orange)
					    }
		                $(".scorer").text(scorer);
		                $(".assister").text(assister);
		                $(".ballspeed").text(ballspeed);
						$(".ballspeedmph").text(ballspeedmph);
		            })
		        })
				WsSubscribers.subscribe("game", "update_state", (d) => {
					let team0 = {};
		            let team1 = {};

		            Object.keys(d['players']).forEach((id) => {
		                if (d['players'][id].team == 0) {
		                    team0 = {...team0,
		                        [id]: {...d['players'][id]
		                        }
		                    };
		                } else {
		                    team1 = {...team1,
		                        [id]: {...d['players'][id]
		                        }
		                    };
		                }
		            });
					if (d['players'][Object.keys(team0)[0]] != undefined) {
						$('#bluename').text("")
						$('#bluescore').text("")
						$('#bluegoals').text("")
						$('#blueassists').text("")
						$('#bluesaves').text("")
						$('#blueshots').text("")
						$('#BluePlayer1Name').text(d['players'][Object.keys(team0)[0]]['name'])
		                $('#BluePlayer1Score').text(d['players'][Object.keys(team0)[0]]['score'])
		                $('#BluePlayer1Goalss').text(d['players'][Object.keys(team0)[0]]['goals'])
		                $('#BluePlayer1Assists').text(d['players'][Object.keys(team0)[0]]['assists'])
		                $('#BluePlayer1Saves').text(d['players'][Object.keys(team0)[0]]['saves'])
		                $('#BluePlayer1Shots').text(d['players'][Object.keys(team0)[0]]['shots'])
					}
					if (d['players'][Object.keys(team0)[1]] != undefined) {
						$('#BluePlayer2Name').text(d['players'][Object.keys(team0)[1]]['name'])
		                $('#BluePlayer2Score').text(d['players'][Object.keys(team0)[1]]['score'])
		                $('#BluePlayer2Goalss').text(d['players'][Object.keys(team0)[1]]['goals'])
		                $('#BluePlayer2Assists').text(d['players'][Object.keys(team0)[1]]['assists'])
		                $('#BluePlayer2Saves').text(d['players'][Object.keys(team0)[1]]['saves'])
		                $('#BluePlayer2Shots').text(d['players'][Object.keys(team0)[1]]['shots'])
					}
					if (d['players'][Object.keys(team0)[2]] != undefined) {
						$('#BluePlayer3Name').text(d['players'][Object.keys(team0)[2]]['name'])
		                $('#BluePlayer3Score').text(d['players'][Object.keys(team0)[2]]['score'])
		                $('#BluePlayer3Goalss').text(d['players'][Object.keys(team0)[2]]['goals'])
		                $('#BluePlayer3Assists').text(d['players'][Object.keys(team0)[2]]['assists'])
		                $('#BluePlayer3Saves').text(d['players'][Object.keys(team0)[2]]['saves'])
		                $('#BluePlayer3Shots').text(d['players'][Object.keys(team0)[2]]['shots'])
					}
					if (d['players'][Object.keys(team1)[0]] != undefined) {
						$('#orangename').text("")
						$('#orangescore').text("")
						$('#orangegoals').text("")
						$('#orangeassists').text("")
						$('#orangesaves').text("")
						$('#orangeshots').text("")
						$('#OrangePlayer1Name').text(d['players'][Object.keys(team1)[0]]['name'])
		                $('#OrangePlayer1Score').text(d['players'][Object.keys(team1)[0]]['score'])
		                $('#OrangePlayer1Goalss').text(d['players'][Object.keys(team1)[0]]['goals'])
		                $('#OrangePlayer1Assists').text(d['players'][Object.keys(team1)[0]]['assists'])
		                $('#OrangePlayer1Saves').text(d['players'][Object.keys(team1)[0]]['saves'])
		                $('#OrangePlayer1Shots').text(d['players'][Object.keys(team1)[0]]['shots'])
					}
					if (d['players'][Object.keys(team1)[1]] != undefined) {
						$('#OrangePlayer2Name').text(d['players'][Object.keys(team1)[1]]['name'])
		                $('#OrangePlayer2Score').text(d['players'][Object.keys(team1)[1]]['score'])
		                $('#OrangePlayer2Goalss').text(d['players'][Object.keys(team1)[1]]['goals'])
		                $('#OrangePlayer2Assists').text(d['players'][Object.keys(team1)[1]]['assists'])
		                $('#OrangePlayer2Saves').text(d['players'][Object.keys(team1)[1]]['saves'])
		                $('#OrangePlayer2Shots').text(d['players'][Object.keys(team1)[1]]['shots'])
					}
					if (d['players'][Object.keys(team1)[2]] != undefined) {
						$('#OrangePlayer3Name').text(d['players'][Object.keys(team1)[2]]['name'])
		                $('#OrangePlayer3Score').text(d['players'][Object.keys(team1)[2]]['score'])
		                $('#OrangePlayer3Goalss').text(d['players'][Object.keys(team1)[2]]['goals'])
		                $('#OrangePlayer3Assists').text(d['players'][Object.keys(team1)[2]]['assists'])
		                $('#OrangePlayer3Saves').text(d['players'][Object.keys(team1)[2]]['saves'])
		                $('#OrangePlayer3Shots').text(d['players'][Object.keys(team1)[2]]['shots'])
					}
					if (d['players'][Object.keys(team1)[2]] != undefined && d['players'][Object.keys(team1)[1]] != undefined && d['players'][Object.keys(team1)[0]] != undefined) {
					let bluescore = d['players'][Object.keys(team0)[0]]['score'] + d['players'][Object.keys(team0)[1]]['score'] + d['players'][Object.keys(team0)[2]]['score']
					let orangescore = d['players'][Object.keys(team1)[0]]['score'] + d['players'][Object.keys(team1)[1]]['score'] + d['players'][Object.keys(team1)[2]]['score']
					let totalscore = bluescore + orangescore;
					let allscore = bluescore / totalscore * 100
					if (totalscore == 0) {
						allscore = "50"
						$('.bluescorepercentage').width(allscore + "%")
					} else {
						$('.bluescorepercentage').width(allscore + "%")
					}
				
					let bluegoal = d['players'][Object.keys(team0)[0]]['goals'] + d['players'][Object.keys(team0)[1]]['goals'] + d['players'][Object.keys(team0)[2]]['goals']
					let orangegoal = d['players'][Object.keys(team1)[0]]['goals'] + d['players'][Object.keys(team1)[1]]['goals'] + d['players'][Object.keys(team1)[2]]['goals']
					let totalgoals = bluegoal + orangegoal;
					let allgoals = bluegoal / totalgoals * 100
					if (totalgoals == 0) {
						allgoals = "50"
						$('.bluegoalpercentage').width(allgoals + "%")
					} else {
						$('.bluegoalpercentage').width(allgoals + "%")
					}
					let blueassist = d['players'][Object.keys(team0)[0]]['assists'] + d['players'][Object.keys(team0)[1]]['assists'] + d['players'][Object.keys(team0)[2]]['assists']
					let orangeassist = d['players'][Object.keys(team1)[0]]['assists'] + d['players'][Object.keys(team1)[1]]['assists'] + d['players'][Object.keys(team1)[2]]['assists']
					let totalassist = blueassist + orangeassist;
					let allassist = blueassist / totalassist * 100
					if (totalassist == 0) {
						allassist = "50"
						$('.blueassistpercentage').width(allassist + "%")
					} else {
						$('.blueassistpercentage').width(allassist + "%")
					}
					
					let bluesaves= d['players'][Object.keys(team0)[0]]['saves'] + d['players'][Object.keys(team0)[1]]['saves'] + d['players'][Object.keys(team0)[2]]['saves']
					let orangesaves= d['players'][Object.keys(team1)[0]]['saves'] + d['players'][Object.keys(team1)[1]]['saves'] + d['players'][Object.keys(team1)[2]]['saves']
					let totalsaves = bluesaves + orangesaves;
					let allsaves = bluesaves / totalsaves * 100
					if (totalsaves == 0) {
						allsaves = "50"
						$('.bluesavespercentage').width(allsaves + "%")
					} else {
						$('.bluesavespercentage').width(allsaves + "%")
					}

					let blueshots= d['players'][Object.keys(team0)[0]]['shots'] + d['players'][Object.keys(team0)[1]]['shots'] + d['players'][Object.keys(team0)[2]]['shots']
					let orangeshots= d['players'][Object.keys(team1)[0]]['shots'] + d['players'][Object.keys(team1)[1]]['shots'] + d['players'][Object.keys(team1)[2]]['shots']
					let totalshots = blueshots + orangeshots;
					let allshots = blueshots / totalshots * 100
					if (totalshots == 0) {
						allshots = "50"
						$('.blueshotspercentage').width(allshots + "%")
					} else {
						$('.blueshotspercentage').width(allshots + "%")
					}
				}
				if (d['players'][Object.keys(team1)[1]] != undefined && d['players'][Object.keys(team1)[0]] != undefined && d['players'][Object.keys(team1)[2]] == undefined) {
					let bluescore = d['players'][Object.keys(team0)[0]]['score'] + d['players'][Object.keys(team0)[1]]['score']
					let orangescore = d['players'][Object.keys(team1)[0]]['score'] + d['players'][Object.keys(team1)[1]]['score']
					let totalscore = bluescore + orangescore;
					let allscore = bluescore / totalscore * 100
					if (totalscore == 0) {
						allscore = "50"
						$('.bluescorepercentage').width(allscore + "%")
					} else {
						$('.bluescorepercentage').width(allscore + "%")
					}
				
					let bluegoal = d['players'][Object.keys(team0)[0]]['goals'] + d['players'][Object.keys(team0)[1]]['goals'] 
					let orangegoal = d['players'][Object.keys(team1)[0]]['goals'] + d['players'][Object.keys(team1)[1]]['goals'] 
					let totalgoals = bluegoal + orangegoal;
					let allgoals = bluegoal / totalgoals * 100
					if (totalgoals == 0) {
						allgoals = "50"
						$('.bluegoalpercentage').width(allgoals + "%")
					} else {
						$('.bluegoalpercentage').width(allgoals + "%")
					}
					let blueassist = d['players'][Object.keys(team0)[0]]['assists'] + d['players'][Object.keys(team0)[1]]['assists'] 
					let orangeassist = d['players'][Object.keys(team1)[0]]['assists'] + d['players'][Object.keys(team1)[1]]['assists'] 
					let totalassist = blueassist + orangeassist;
					let allassist = blueassist / totalassist * 100
					if (totalassist == 0) {
						allassist = "50"
						$('.blueassistpercentage').width(allassist + "%")
					} else {
						$('.blueassistpercentage').width(allassist + "%")
					}
					
					let bluesaves= d['players'][Object.keys(team0)[0]]['saves'] + d['players'][Object.keys(team0)[1]]['saves'] 
					let orangesaves= d['players'][Object.keys(team1)[0]]['saves'] + d['players'][Object.keys(team1)[1]]['saves'] 
					let totalsaves = bluesaves + orangesaves;
					let allsaves = bluesaves / totalsaves * 100
					if (totalsaves == 0) {
						allsaves = "50"
						$('.bluesavespercentage').width(allsaves + "%")
					} else {
						$('.bluesavespercentage').width(allsaves + "%")
					}

					let blueshots= d['players'][Object.keys(team0)[0]]['shots'] + d['players'][Object.keys(team0)[1]]['shots'] 
					let orangeshots= d['players'][Object.keys(team1)[0]]['shots'] + d['players'][Object.keys(team1)[1]]['shots'] 
					let totalshots = blueshots + orangeshots;
					let allshots = blueshots / totalshots * 100
					if (totalshots == 0) {
						allshots = "50"
						$('.blueshotspercentage').width(allshots + "%")
					} else {
						$('.blueshotspercentage').width(allshots + "%")
					}
				}
				if (d['players'][Object.keys(team1)[0]] != undefined && d['players'][Object.keys(team1)[1]] == undefined && d['players'][Object.keys(team1)[2]] == undefined) {
					let bluescore = d['players'][Object.keys(team0)[0]]['score']
					let orangescore = d['players'][Object.keys(team1)[0]]['score']
					let totalscore = bluescore + orangescore;
					let allscore = bluescore / totalscore * 100
					if (totalscore == 0) {
						allscore = "50"
						$('.bluescorepercentage').width(allscore + "%")
					} else {
						$('.bluescorepercentage').width(allscore + "%")
					}
				
					let bluegoal = d['players'][Object.keys(team0)[0]]['goals']
					let orangegoal = d['players'][Object.keys(team1)[0]]['goals']
					let totalgoals = bluegoal + orangegoal;
					let allgoals = bluegoal / totalgoals * 100
					if (totalgoals == 0) {
						allgoals = "50"
						$('.bluegoalpercentage').width(allgoals + "%")
					} else {
						$('.bluegoalpercentage').width(allgoals + "%")
					}
					let blueassist = d['players'][Object.keys(team0)[0]]['assists']
					let orangeassist = d['players'][Object.keys(team1)[0]]['assists'] 
					let totalassist = blueassist + orangeassist;
					let allassist = blueassist / totalassist * 100
					if (totalassist == 0) {
						allassist = "50"
						$('.blueassistpercentage').width(allassist + "%")
					} else {
						$('.blueassistpercentage').width(allassist + "%")
					}
					
					let bluesaves= d['players'][Object.keys(team0)[0]]['saves']
					let orangesaves= d['players'][Object.keys(team1)[0]]['saves']
					let totalsaves = bluesaves + orangesaves;
					let allsaves = bluesaves / totalsaves * 100
					if (totalsaves == 0) {
						allsaves = "50"
						$('.bluesavespercentage').width(allsaves + "%")
					} else {
						$('.bluesavespercentage').width(allsaves + "%")
					}

					let blueshots= d['players'][Object.keys(team0)[0]]['shots']
					let orangeshots= d['players'][Object.keys(team1)[0]]['shots']
					let totalshots = blueshots + orangeshots;
					let allshots = blueshots / totalshots * 100
					if (totalshots == 0) {
						allshots = "50"
						$('.blueshotspercentage').width(allshots + "%")
					} else {
						$('.blueshotspercentage').width(allshots + "%")
					}
				}
		    })
			
			WsSubscribers.subscribe("game", "pre_countdown_begin", (d) => {
                $('.scoreboardblue').css('visibility', 'hidden')
				$('.scoreboardorange').css('visibility', 'hidden')
				$('.scoreboardimage').css('visibility', 'hidden')
				$('.Bluescorecontainer').css('visibility', 'hidden')
				$('.bluescorename').css('visibility', 'hidden')
				$('.Bluegoalcontainer').css('visibility', 'hidden')
				$('.bluegoalname').css('visibility', 'hidden')
				$('.Blueassistcontainer').css('visibility', 'hidden')
				$('.blueassistname').css('visibility', 'hidden')
				$('.Bluesavescontainer').css('visibility', 'hidden')
				$('.bluesavename').css('visibility', 'hidden')
				$('.Blueshotscontainer').css('visibility', 'hidden')
				$('.blueshotname').css('visibility', 'hidden')
				$('.blueunder').css('visibility', 'hidden')
				$('.orangeunder').css('visibility', 'hidden')
		})
			WsSubscribers.subscribe("game", "podium_start", (d) => {
                $('.scoreboardblue').css('visibility', 'visible')
				$('.scoreboardorange').css('visibility', 'visible')
				$('.scoreboardimage').css('visibility', 'visible')
				$('.Bluescorecontainer').css('visibility', 'visible')
				$('.bluescorename').css('visibility', 'visible')
				$('.Bluegoalcontainer').css('visibility', 'visible')
				$('.bluegoalname').css('visibility', 'visible')
				$('.Blueassistcontainer').css('visibility', 'visible')
				$('.blueassistname').css('visibility', 'visible')
				$('.Bluesavescontainer').css('visibility', 'visible')
				$('.bluesavename').css('visibility', 'visible')
				$('.Blueshotscontainer').css('visibility', 'visible')
				$('.blueshotname').css('visibility', 'visible')
				$('.blueunder').css('visibility', 'visible')
				$('.orangeunder').css('visibility', 'visible')
				
		})
		WsSubscribers.subscribe("game", "match_ended", (d) => {
			$('.scoreboardblue').css('visibility', 'hidden')
			$('.scoreboardorange').css('visibility', 'hidden')
			$('.scoreboardimage').css('visibility', 'hidden')
			$('.Bluescorecontainer').css('visibility', 'hidden')
			$('.bluescorename').css('visibility', 'hidden')
			$('.Bluegoalcontainer').css('visibility', 'hidden')
			$('.bluegoalname').css('visibility', 'hidden')
			$('.Blueassistcontainer').css('visibility', 'hidden')
			$('.blueassistname').css('visibility', 'hidden')
			$('.Bluesavescontainer').css('visibility', 'hidden')
			$('.bluesavename').css('visibility', 'hidden')
			$('.Blueshotscontainer').css('visibility', 'hidden')
			$('.blueshotname').css('visibility', 'hidden')
			$('.blueunder').css('visibility', 'hidden')
			$('.orangeunder').css('visibility', 'hidden')
	})
	WsSubscribers.subscribe("game", "match_destroyed", (d) => {
		$('.scoreboardblue').css('visibility', 'hidden')
		$('.scoreboardorange').css('visibility', 'hidden')
		$('.scoreboardimage').css('visibility', 'hidden')
		$('.Bluescorecontainer').css('visibility', 'hidden')
		$('.bluescorename').css('visibility', 'hidden')
		$('.Bluegoalcontainer').css('visibility', 'hidden')
		$('.bluegoalname').css('visibility', 'hidden')
		$('.Blueassistcontainer').css('visibility', 'hidden')
		$('.blueassistname').css('visibility', 'hidden')
		$('.Bluesavescontainer').css('visibility', 'hidden')
		$('.bluesavename').css('visibility', 'hidden')
		$('.Blueshotscontainer').css('visibility', 'hidden')
		$('.blueshotname').css('visibility', 'hidden')
		$('.blueunder').css('visibility', 'hidden')
		$('.orangeunder').css('visibility', 'hidden')
})
		})
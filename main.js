!function()
{
    Game.registerMod("autobankminigame",
    {
        id_to_building: {
            0: "Farm",
            1: "Mine",
            2: "Factory",
            3: "Bank",
            4: "Temple",
            5: "Wizard tower",
            6: "Shipment",
            7: "Alchemy lab",
            8: "Portal",
            9: "Time machine",
            10: "Antimatter condenser",
            11: "Prism",
            12: "Chancemaker",
            13: "Fractal engine",
            14: "Javascript console",
            15: "Idleverse",
            16: "Cortex baker",
        },

        auto_bank_enabled: false,
        buy_threshold: 0.75,
        sell_threshold: 1.25,

        hook_added: false,
        
        init: function()
        {
            Game.Notify('Auto stocks trading loaded', `Use the settings menu to enable auto stock trading`, [16, 5], 5);
            
            let MOD = this;
            
            let menu = Game.UpdateMenu;
            
            Game.UpdateMenu = function(){
                menu();
                
                if (Game.onMenu == 'prefs')
                {
                    document.querySelector("#screenreaderButton").nextElementSibling.nextElementSibling.insertAdjacentHTML("afterend", `
                        <a class="smallFancyButton prefButton option ${MOD.auto_bank_enabled ? "on" : "off"}" id="auto-bank-button" onclick="Game.toggle_auto_bank()">Auto stock trading ${MOD.auto_bank_enabled ? "ON" : "OFF"}</a>
                        <label>(automatically trade stocks for the bank minigame for consistent profit using the <a href="https://cookieclicker.fandom.com/wiki/Stock_Market#Strategy">resting value</a>)</label>
                        <br>
                        
                        <a class="smallFancyButton prefButton option ${MOD.buy_threshold}" id="buy-threshold-button" onclick="Game.set_buy_threshold()">Buy threshold ${MOD.buy_threshold*100}%</a>
                        <label>(buy threshold for stocks, represented buy percentage of the resting value)</label>
                        <br>
                        
                        <a class="smallFancyButton prefButton option ${MOD.sell_threshold}" id="sell-threshold-button" onclick="Game.set_sell_threshold()">Sell threshold ${MOD.sell_threshold*100}%</a>
                        <label>(sell threshold for stocks, represented sell percentage of the resting value)</label>
                        <br>
                    `);
                    
                    setTimeout(() =>
                    {
                        MOD.auto_bank_button = l("auto-bank-button");
                        MOD.buy_thresholdd_button = l("buy-threshold-button");
                        MOD.sell_threshold_button = l("sell-threshold-button");
                    }, 50);
                }
            };

            Game.toggle_auto_bank = function()
            {
                MOD.auto_bank_enabled = !MOD.auto_bank_enabled;
                if (!MOD.auto_bank_enabled)
                {
                    try
                    {
                        MOD.auto_bank_button.textContent = "Auto stock trading OFF";
                        MOD.auto_bank.classList.remove("on");
                        MOD.auto_sac_button.classList.add("off");
                    }
                    
                    catch(ex) {}
                    
                }
                
                else
                {
                    try
                    {
                        MOD.auto_bank_button.textContent = "Auto stock trading ON";
                        MOD.auto_bank_button.classList.remove("off");
                        MOD.auto_bank_button.classList.add("on");
                    }
                    
                    catch(ex) {}
                }
                setTimeout(function () {
                    MOD.add_hook();
                }, 5000);
            };

            Game.set_buy_threshold = function()
            {
                if (MOD.buy_threshold == 1)
                {
                    MOD.buy_threshold = 0.1;
                }
                else
                {
                    MOD.buy_threshold += 0.05;
                    MOD.buy_threshold = parseFloat(MOD.buy_threshold.toFixed(2));
                }
            };

            Game.set_sell_threshold = function()
            {
                if (MOD.sell_threshold == 1)
                {
                    MOD.sell_threshold = 1.9;
                }
                else
                {
                    MOD.sell_threshold -= 0.05;
                    MOD.sell_threshold = parseFloat(MOD.sell_threshold.toFixed(2));
                }
            };
        },
        
        save: function()
        {
            return `${this.auto_bank_enabled.toString()}|${this.buy_threshold}|${this.sell_threshold}`;
        },
        load: function(str)
        {
            if (str.indexOf("|") === -1)
            {
                this.auto_bank_enabled = false;
                this.buy_threshold = 0.75;
                this.sell_threshold = 1.25;
                
                return;
            }
            
            let components = str.split("|");
            
            //this.auto_bank_enabled = components[0] == "true" ? true : false;
            this.buy_threshold = parseFloat(components[1]);
            this.sell_threshold = parseFloat(components[2]);
            if (this.auto_bank_enabled != components[0])
            {
                Game.toggle_auto_bank();
            }
        },
         
        add_hook: function()
        {
            if (this.hook_added)
            {
                return;
            }
            
            this.hook_added = true;

            let MOD = this;
            
            let og_tick = Game.ObjectsById[5].minigame.tick;
            
            Game.ObjectsById[5].minigame.tick = function()
            {
                og_tick();
                
                if (MOD.auto_bank_enabled)
                {
                    MOD.post_tick_logic(MOD);
                }
            };
            
            MOD.BANK = Game.ObjectsById[5]
            MOD.STOCK_MARKET = Game.ObjectsById[5].minigame;
            MOD.GOODS = Game.ObjectsById[5].minigame.goods;
        },
        
        post_tick_logic: function(MOD)
        {
            for (const [key, value] of Object.entries(MOD.id_to_building)) {
                let max = MOD.STOCK_MARKET.getGoodMaxStock(MOD.GOODS[value])
                if (MOD.check_buy(MOD, value))
                {
                    console.log("bought" + key)
                    MOD.STOCK_MARKET.buyGood(key, max);
                }
                else
                {
                    if (MOD.check_sell(MOD, value))
                    {
                        console.log("sold" + key)
                        MOD.STOCK_MARKET.sellGood(key, max);
                    }
                }
            }
        },

        calculate_rest_value: function(MOD, id)
        {
            return 10*(parseInt(id)+1) + (MOD.BANK.level-1);
        },
        
        check_buy: function(MOD, building)
        {
            return MOD.GOODS[building].val <= MOD.calculate_rest_value(MOD, MOD.getKeyByValue(MOD.id_to_building, building))*MOD.buy_threshold;
        },
        check_sell: function(MOD, building)
        {
            return MOD.GOODS[building].val >= MOD.calculate_rest_value(MOD, MOD.getKeyByValue(MOD.id_to_building, building))*MOD.sell_threshold;
        },

        getKeyByValue: function(object, value)
        {
            return Object.keys(object).find(key => object[key] === value);
        }
        
    });
}();
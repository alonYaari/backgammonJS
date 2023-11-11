<template>
    <div>
        <img class = "dice"  :src="diceResult()" :style="computedStyle"  > 
        <!-- <div :class="diceResult"></div> -->
    </div>
</template>

<script>
    export default {
        name:'DiceComponent',
        props:['diceValue', 'lefty', 'timesLeft' , 'clicked', 'sideOfBoard'],
        
        data(){
            return{
            };
        },

        computed: {
            computedStyle() {
                let borderStyle = this.clicked ? '11px solid #ccc' : 'none'
                borderStyle = this.timesLeft ? borderStyle : '11px solid #fff'
                let style = {
                  top: '50%', // Default top position
                  
                  border: borderStyle, // Border style
                  
                };
            
                if (this.sideOfBoard === 1) {
                  style.left = this.lefty ? '80%' : '66%'; // Adjust left position for side 1
                } else {
                  style.left = this.lefty ? '34%' : '22%'; // Adjust left position for side 2
                }
            
                return style;
            },              

        },
        methods:{
            diceResult(){
                let path = "./diceImg/diceImg" + this.diceValue;
                return require(path + ".png")
            },
        

        // firstDice:
        // {
        //     // get(){return this.firstDice},
        //     // set(value)
        //     // {
        //     // console.log(value)
        //     // const names = value.split(' ')
        //     // this.firstName = names[0]
        //     // this.lastName = names[1]
        //     // }
        // }
        },

       
    }
</script>

<style scoped>
.dice{
    height: 10vh;
    width: 10vh;
}
</style>
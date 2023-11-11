<template>
    <img v-if="!piece.isOut" class="piece" :indexPos="piece.indexPosition" 
    :style="calculateCssPosition(this.piece.position, this.piece.indexPosition)" 
    :src="computedSrc" />
</template>


<script>
export default
{
    name:'PieceComponent',
    props:{
        piece:
        {
            type:Object,
            required:true,   
            isOut: false
        },

       
    },
    computed:
    {
        computedSrc()
        { 
            let pieceImg = this.piece.team == 1? "./piecesImg/redPiece"
             : "./piecesImg/blackPiece";
            return require(pieceImg + '.png');
        },

    },
    methods:
    {
        calculateCssPosition(position, indexPosition)
        {
            // jailed
            if (position == -10){return{ left: '50%', top: 50-indexPosition*7 + '%'}}
            const diff = 6.96;
            const top = position <=12 ? 90 - indexPosition*6 : 10 + indexPosition*6;
            let startingPos =0, startingTile= 0, offsetFromStart= 0;
            if (position <= 12){    
                startingPos = position > 6 ? 44.05 : 90.8;
                startingTile = position > 6 ? 7 : 1;
                offsetFromStart = -1*(position-startingTile)*diff;
            }
            else
            {       // > 12
                startingPos = position > 18 ? 56 : 9.25;
                startingTile = position > 18 ? 19 : 13;
                offsetFromStart = (position-startingTile)*diff;
            }
        

            return { left: (startingPos + offsetFromStart) + '%', top:top + '%'}
        }
    },
}

</script>

<style>
.piece{ height: 80px; width:80px;}
</style>
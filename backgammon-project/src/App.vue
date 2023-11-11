<template>
  <div id="app">
    <!-- Use a div as a container for the background image -->
    <div class="imageContainer">
      <img alt="board" src="@/assets/backgammonBoard.jpeg" />
    </div>
    <div class="game-over-message" v-if="winMessage">
      {{ winMessage }}
    </div>
    <div>
      <PieceComponent v-for="(piece, index) in pieces" :isOut="false" :key="index" @click="makeAMove(piece)"
        :piece="piece"></PieceComponent>
      <DiceComponent :diceValue="dices[0].value" @click="changeClickedDice(0)" :lefty="1" :timesLeft="dices[0].timesLeft"
        :clicked="dices[0].clicked" :sideOfBoard="dices[0].sideOfBoard" />

      <DiceComponent :diceValue="dices[1].value" @click="changeClickedDice(1)" :lefty="0" :timesLeft="dices[1].timesLeft"
        :clicked="dices[1].clicked" :sideOfBoard="dices[1].sideOfBoard" />
      <button @click="rollDices()">Roll Dice</button>

    </div>



    <!-- Your website content goes here -->

  </div>
</template>

<script>

import PieceComponent from './components/PieceComponent.vue';
import DiceComponent from './components/DiceComponent.vue';
import SharedSocket from './components/SharedSocket.js'


export default {
  name: 'App',
  data() {
    return {
      players:
        [
          { team: 1, isGoingUp: false, isExiting: true, prisoners: 0, maxPosition: 24, piecesLeft: 15 },
          { team: 2, isGoingUp: true, isExiting: false, prisoners: 0, maxPosition: 1, piecesLeft: 15 }
        ],
      dices: [{ value: Math.floor(Math.random() * 6) + 1, clicked: false, timesLeft: 0, sideOfBoard: 2 },
      { value: Math.floor(Math.random() * 6) + 1, clicked: false, timesLeft: 0, sideOfBoard: 2 }],
      currentlyClickedDice: Object,
      currentPlayer: Object,
      myPlayer: Object,
      socket: null,
      pieces:
        [
          // first team
          { team: "1", position: 24, indexPosition: 0 },
          { team: "1", position: 24, indexPosition: 1 },

          { team: "1", position: 13, indexPosition: 0 },
          { team: "1", position: 13, indexPosition: 1 },
          { team: "1", position: 13, indexPosition: 2 },
          { team: "1", position: 13, indexPosition: 3 },
          { team: "1", position: 13, indexPosition: 4 },

          { team: "1", position: 8, indexPosition: 0 },
          { team: "1", position: 8, indexPosition: 1 },
          { team: "1", position: 8, indexPosition: 2 },

          { team: "1", position: 6, indexPosition: 0 },
          { team: "1", position: 6, indexPosition: 1 },
          { team: "1", position: 6, indexPosition: 2 },
          { team: "1", position: 6, indexPosition: 3 },
          { team: "1", position: 6, indexPosition: 4 },

          // second team
          { team: "2", position: 1, indexPosition: 0 },
          { team: "2", position: 1, indexPosition: 1 },

          { team: "2", position: 12, indexPosition: 0 },
          { team: "2", position: 12, indexPosition: 1 },
          { team: "2", position: 12, indexPosition: 2 },
          { team: "2", position: 12, indexPosition: 3 },
          { team: "2", position: 12, indexPosition: 4 },

          { team: "2", position: 17, indexPosition: 0 },
          { team: "2", position: 17, indexPosition: 1 },
          { team: "2", position: 17, indexPosition: 2 },

          { team: "2", position: 19, indexPosition: 0 },
          { team: "2", position: 19, indexPosition: 1 },
          { team: "2", position: 19, indexPosition: 2 },
          { team: "2", position: 19, indexPosition: 3 },
          { team: "2", position: 19, indexPosition: 4 },
        ],
      winMessage: null,

    }
  },

  created() {
    // This method will be called after data() and before the template is mounted
    this.currentPlayer = this.players[0];
    this.currentlyClickedDice = null;

    SharedSocket.on('connection', () => {
      console.log('Connected to the server');
    });

    SharedSocket.on('message', (event) => {
      if (event === 1 || event === 2) {
        console.log(event)
        if (event === 2) this.rollDices();

        this.myPlayer = this.players[event - 1];
        return;
      }

      const jsonData = JSON.parse(event);
      const currPlayer = jsonData.currPlayer
      const players = jsonData.players
      const receivedDices = jsonData.dices
      const receivedPieces = jsonData.pieces
      this.currentPlayer = currPlayer

      // important
      this.players = players
      //.currentPlayer.prisoners = opponentPrisoners
      this.myPlayer = this.myPlayer.team == 1 ? this.players[0] : this.players[1]

      this.dices = receivedDices
      this.pieces = receivedPieces
    });

    SharedSocket.on('disconnect', () => {
      // Handle WebSocket close event (e.g., server or client disconnect)
      console.log('Disconnected from the server');
    });
  },

  methods: {
    makeAMove(clickedPiece) {
      if (!this.players[0].piecesLeft || !this.players[1].piecesLeft) return;
      if (this.currentlyClickedDice === null || !this.currentlyClickedDice.clicked) return
      if (this.myPlayer.team != clickedPiece.team || (this.myPlayer.team != this.currentPlayer.team)) return;
      if (!this.currentlyClickedDice.timesLeft) return;
      if (this.dices[0].sideOfBoard != this.myPlayer.team) return;
      if (!this.canMove(this.myPlayer)) {
        this.currentPlayer = this.currentPlayer.team == 1 ? this.players[1] : this.players[0]
        this.resetDices();
        return;
      }

      // if is jailed:
      if (this.myPlayer.prisoners) {
        if (clickedPiece.position != -10) return;
        if (!this.isValidJailMove(this.myPlayer)) return;
        this.jailMove(clickedPiece, this.myPlayer);
      }
      else {
        if (!this.isValidMove(clickedPiece, this.myPlayer)) return;
        this.move(clickedPiece, this.myPlayer)
      }
      this.currentlyClickedDice.timesLeft--;
      console.log(this.dices)

      if (this.everybodyHome(this.myPlayer)) {
        this.myPlayer.isExiting = true;

      }
      if (this.shouldTeamChange()) {
        // player also needs to click roll dices
        this.currentPlayer = this.currentPlayer.team == 1 ? this.players[1] : this.players[0]
      }

      //ALARMMMMMMMMMMMMMMMMMMMMMMMMMMM: new chang- could make a bug
      this.currentlyClickedDice.clicked = false
      this.notifyServer();
    },


    canMove(currentPlayer) {
      // jailed and no open space
      if (currentPlayer.prisoners) {

        let currentClickedSave = this.currentlyClickedDice;

        this.currentlyClickedDice = this.dices[0];
        let res = this.isValidJailMove(currentPlayer) * this.dices[0].timesLeft;
        this.currentlyClickedDice = this.dices[1];
        res += this.isValidJailMove(currentPlayer) * this.dices[1].timesLeft;

        this.currentlyClickedDice = currentClickedSave
        return res;
      }
      // not jailed, check if any cube can play
      let currentClickedSave = this.currentlyClickedDice;
      let res = false;
      for (const dice of this.dices) {
        if (dice.timesLeft) {
          this.currentlyClickedDice = dice;
          for (const piece of this.pieces) {
            if (piece.position == -1) continue;
            if (this.isValidMove(piece, currentPlayer)) {
              res = true
              break;
            }
          }
        }
      }
      this.currentlyClickedDice = currentClickedSave
      return res;
    },

    shouldTeamChange() {
      return (!this.dices[0].timesLeft && !this.dices[1].timesLeft)
    },

    jailMove(clickedPiece, playerOfPiece) {
      let didEat = false;
      const enteringPosition = playerOfPiece.isGoingUp ?
        this.currentlyClickedDice.value
        :
        playerOfPiece.maxPosition + 1 - this.currentlyClickedDice.value
      const piecesAtPos = this.getPiecesAtPosition(enteringPosition);
      if (piecesAtPos.team != playerOfPiece.team && piecesAtPos.amount) {
        didEat = true;
        this.literallyEat(piecesAtPos.allPieces[0])
      }


      playerOfPiece.prisoners--;
      playerOfPiece.isExiting = false;
      clickedPiece.position = enteringPosition;
      clickedPiece.indexPosition = didEat ? 0 : piecesAtPos.amount;
    },
    move(clickedPiece, playerOfPiece) {
      const currentDiceValue = Number(this.currentlyClickedDice.value);
      const updatedPosition = playerOfPiece.isGoingUp ?
        clickedPiece.position + currentDiceValue
        : clickedPiece.position - currentDiceValue;

      // here we already know he is exiting
      if (updatedPosition > 24 || updatedPosition < 1) {
        clickedPiece.isOut = true;
        clickedPiece.position = -1;
        playerOfPiece.piecesLeft--;
        if (!playerOfPiece.piecesLeft) { this.declareWin(); }
        return;
      }

      const piecesInfoAtNewPos = this.getPiecesAtPosition(updatedPosition);
      // update position
      clickedPiece.position = updatedPosition

      // change indexPosition and eat if needed
      if ((piecesInfoAtNewPos.team != clickedPiece.team) && piecesInfoAtNewPos.team != 0) {
        // will only get in if the piece at new pos is enemy,
        // and we already chacked that its only one piece (line 151?)
        clickedPiece.indexPosition = 0
        this.literallyEat(piecesInfoAtNewPos.allPieces[0])
      }
      else {
        clickedPiece.indexPosition = piecesInfoAtNewPos.amount
      }


    },

    literallyEat(eatenPlayer) {
      eatenPlayer.position = -10 //go to jail
      eatenPlayer.indexPosition = this.players[0].prisoners +
        this.players[1].prisoners;
      this.players[eatenPlayer.team - 1].prisoners++;

    },

    isValidMove(piece, playerOfPiece) {


      if (piece.team != playerOfPiece.team) return false
      // need to implement highest in pos
      const currentDiceValue = this.currentlyClickedDice.value;
      const updatedPosition = playerOfPiece.isGoingUp ? piece.position
        + currentDiceValue
        : Number(piece.position) - currentDiceValue;

      let piecesInfoAtPos = this.getPiecesAtPosition(piece.position)


      // checks if the piece is the highest at the piece's position
      if (piecesInfoAtPos.amount - 1 > piece.indexPosition) return false;

      // if not out of board
      if ((updatedPosition < 1 || updatedPosition > 24) && !playerOfPiece.isExiting)
        return false;

      // means that he is exiting
      if (updatedPosition < 1 || updatedPosition > 24) return true;


      piecesInfoAtPos = this.getPiecesAtPosition(updatedPosition);
      // if is enemy house (checking on updated position):                
      if (piecesInfoAtPos.team != playerOfPiece.team &&
        piecesInfoAtPos.amount > 1) return false;

      // otherwise, means that it is either: empty, one enemy, many friends
      return true;

    },

    isValidJailMove(playerOfPiece) {
      const enteringPosition = playerOfPiece.isGoingUp ?
        this.currentlyClickedDice.value
        :
        playerOfPiece.maxPosition + 1 - this.currentlyClickedDice.value
      const piecesAtPos = this.getPiecesAtPosition(enteringPosition);
      // if landed on enemy house
      if (piecesAtPos.amount > 1 && piecesAtPos.team != playerOfPiece.team)
        return false;
      return true;
    },

    everybodyHome(playerOfPiece) {
      if (playerOfPiece.isGoingUp) {
        for (const piece of this.pieces) {
          if (piece.team == playerOfPiece.team
            && piece.position < 19 && piece.position != -1)
            return false;
        }
      }
      else {
        for (const piece of this.pieces) {
          if (piece.team == playerOfPiece.team
            && piece.position > 6)
            return false;
        }
      }
      return true;
    },

    getPiecesAtPosition(updatedPosition) {
      let piecesAtUpdatedPosition = 0;
      let team = 0;
      let pieces = [];
      for (const piece of this.pieces) {
        if (piece.position == updatedPosition) {
          pieces.push(piece);
          piecesAtUpdatedPosition++;
          team = piece.team;
        }
      }

      return { allPieces: pieces, team: team, amount: piecesAtUpdatedPosition }
    },

    resetDices() {
      this.dices[0].timesLeft = 0;
      this.dices[1].timesLeft = 0;
      this.notifyServer();
    },



    rollDices() {
      if (this.dices[0].timesLeft != 0 || this.dices[1].timesLeft != 0) return;
      if (this.dices[0].sideOfBoard == this.myPlayer.team) return;
      this.dices[0].value = Math.floor(Math.random() * 6) + 1;
      this.dices[1].value = Math.floor(Math.random() * 6) + 1;
      this.dices[0].clicked = this.dices[1].clicked = false
      this.dices[0].timesLeft = this.dices[1].timesLeft =
        (this.dices[0].value == this.dices[1].value) ?
          2 : 1;

      this.dices[0].sideOfBoard = this.dices[1].sideOfBoard = this.dices[0].sideOfBoard == 1 ? 2 : 1;
      this.notifyServer();
    },

    changeClickedDice(indx) {
      this.dices[indx].clicked = true;
      this.currentlyClickedDice = this.dices[indx];
      indx -= 1;
      indx *= -1;
      this.dices[indx].clicked = false;
    },

    declareWin() {
      this.winMessage = this.players[0].piecesLeft ? 'black won' : 'red won'

      // display this message inside a nice div with styling  (it is a game over message)           
    },


    notifyServer() {
      const data =
      {
        players: this.players,
        dices: this.dices,
        pieces: this.pieces,
        currPlayer: this.currentPlayer,
      }
      
      SharedSocket.emit('message', JSON.stringify(data));
    }
  },

  components: {
    PieceComponent,
    DiceComponent
  },

};
</script>

<style>
#app {
  margin: 0;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
}

.imageContainer {
  height: 98vh;
}


/* Style the background image */
img {
  height: 100%;
  width: 100%;

  display: block;
  /* Remove any extra spacing below the image */
}

.game-over-message {
  height: 60px;
  width: 120px;
  position: absolute;
  /* Position the message absolutely within the container */
  top: 50%;
  /* Adjust the top value as needed */
  left: 50%;
  /* Adjust the left value as needed */
  transform: translate(-50%, -50%);
  /* Center the message both horizontally and vertically */
  background: rgba(70, 130, 180, 0.8);
  /* Modern blue background color with transparency */
  padding: 20px;
  /* Increase padding for a bigger message */
  border: 2px solid #000;
  border-radius: 25px;
  color: white;
  /* Text color */
  font-size: 34px;
  /* Increase font size for a bigger message */
  transition: background-color 0.3s;
  /* Add hover transition */
  cursor: pointer;
  /* Add a pointer cursor for hover effect */
  animation: glow 1s infinite alternate;
}


.game-over-message:hover {
  background: rgba(0, 0, 255, 0.8);
  /* New background color on hover */
}

@keyframes glow {
  from {
    background-color: rgba(0, 0, 255, 0.8);
    /* Start with the original blue color */
  }

  to {
    background-color: rgba(70, 130, 180, 0.8);
    /* Transition to the glowing blue color */
  }
}

.piece {
  position: absolute;
  /* Allows precise positioning */
  transform: translate(-50%, -50%);
  /* Center the image */
  z-index: 1;
  /* Make sure it's above the background */
  /* Additional styles for image size, etc. */
}

.dice {
  position: absolute;
  /* Allows precise positioning */
  transform: translate(-50%, -50%);
  /* Center the image */
  z-index: 1;
  /* Make sure it's above the background */
  /* Additional styles for image size, etc. */

}

/* Border styles for when dice.timesLeft is 0 */
.borderAfterUse {
  border: 8px solid #fff;
  /* 8px solid white border */
}
</style>

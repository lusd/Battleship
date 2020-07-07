(function init() {
  const SHIP_TYPE = "ship";
  const WATER_TYPE = "water";
  const NEIGHBOR_TYPE = "neighbor";

  class Stats {
    constructor() {
      this.remainingShips = {
        node: document.getElementById("remainingShips"),
        count: 0,
      };
      this.shots = {
        node: document.getElementById("shots"),
        count: 0,
        absoluteRecord: localStorage.getItem("battleShipAbsolute"),
      };
      this.lastHit = {
        node: document.getElementById("lastShot"),
        value: "",
      };
      this.accuracy = {
        node: document.getElementById("accuracy"),
        hits: 0,
      };
    }
    updateRemainingShips(remaningShips) {
      this.remainingShips.count = remaningShips;
    }
    incShotCount() {
      this.shots.count += 1;
    }
    incHitsCount() {
      this.accuracy.hits += 1;
    }
    updateLastHit(col, row) {
      this.lastHit.value = `${col}, ${row}`;
    }
    render() {
      this.remainingShips.node.value = this.remainingShips.count;
      this.shots.node.value = this.shots.count;
      this.lastHit.node.value = this.lastHit.value;
      if (this.shots.count === 0) {
        this.accuracy.node.value = "";
      } else {
        this.accuracy.node.value = `${(
          (this.accuracy.hits / this.shots.count) *
          100
        ).toFixed(2)} %`;
      }
    }
    saveRecord() {
      localStorage.setItem("battleShipAbsolute", this.shots.count);
    }
  }

  class Game {
    constructor(battleField) {
      this.canvas = battleField.getContext("2d");
      this.boardSize = 10; // size of field 10 x 10
      this.cellSize = 30; // 30px for each cell
      this.board = new Array(this.boardSize);
      this.ships = [];
      this.stats = new Stats();

      // board array of array'
      for (let i = 0; i < this.board.length; i++) {
        this.board[i] = new Array(this.boardSize);
      }

      //fill ships array with object Ship
      const shipLengths = [
        { length: 4, count: 1 },
        { length: 3, count: 2 },
        { length: 2, count: 3 },
        { length: 1, count: 4 },
      ];

      let shipIdCounter = 1;

      for (const { length, count } of shipLengths) {
        for (let i = 0; i < count; i++) {
          this.ships.push(new Ship(length, shipIdCounter++));
        }
      }

      //draw canvas field and fill board and battleships array's with zeros;
      for (let i = 0; i < this.boardSize; i++) {
        for (let j = 0; j < this.boardSize; j++) {
          this.canvas.fillStyle = "rgb(189,229,231)";
          this.canvas.strokeStyle = "rgb(254,250,203)";
          this.canvas.fillRect(
            j * this.cellSize,
            i * this.cellSize,
            this.cellSize,
            this.cellSize
          );
          this.canvas.strokeRect(
            j * this.cellSize,
            i * this.cellSize,
            this.cellSize,
            this.cellSize
          );
          this.board[i][j] = new Cell(WATER_TYPE);
        }
      }
      this.placeShips();
      this.stats.render();
    }

    fire(x, y) {
      const col = Math.floor(x / this.cellSize);
      const row = Math.floor(y / this.cellSize);
      const cell =
        this.board[col] && this.board[col][row] ? this.board[col][row] : false;

      if (cell === false || cell.isRevealed === true) return;

      this.revealCell(this.board[col][row], col, row);

      if (cell.type === SHIP_TYPE) {
        const ship = this.ships.find((ship) => ship.id === cell.shipId);
        ship.hit();
        this.stats.incHitsCount();

        // checking is ship destroyed after hit?
        if (ship.destroyed) {
          this.revealDestroyedShipCells(cell.shipId);
          const index = this.ships.indexOf(ship);
          this.ships.splice(index, 1);
        }
      }
      this.updateStats(col, row);
      //end of game;
      if (this.ships.length === 0) {
        for (let i = 0; i < this.boardSize; i++) {
          for (let j = 0; j < this.boardSize; j++) {
            if (!this.board[i][j].isRevealed) {
              this.revealCell(this.board[i][j], i, j);
            }
          }
        }
        setTimeout(() => {
          if (
            this.stats.shots.absoluteRecord === null ||
            this.stats.shots.absoluteRecord > this.stats.shots.count
          ) {
            this.stats.saveRecord();
            alert(
              `Congratulations, new record: only ${this.stats.shots.count} shots`
            );
          } else if (
            this.stats.shots.absoluteRecord === this.stats.shots.count
          ) {
            alert(
              `All ships destroyed, you repeated absolute record with ${this.stats.shots.count} shots`
            );
          } else {
            alert("All ships destroyed");
          }
        }, 100);
      }
    }

    revealDestroyedShipCells(id) {
      for (let i = 0; i < this.boardSize; i++) {
        for (let j = 0; j < this.boardSize; j++) {
          if (
            this.board[i][j].type === NEIGHBOR_TYPE &&
            this.board[i][j].neighborIds.indexOf(id) >= 0
          ) {
            this.revealCell(this.board[i][j], i, j);
          }
        }
      }
    }

    updateStats(col, row) {
      const colsArray = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
      const rowsArray = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

      this.stats.updateRemainingShips(this.ships.length);
      this.stats.incShotCount();
      this.stats.updateLastHit(colsArray[col], rowsArray[row]);
      this.stats.render();
    }

    // draw cell on canvas;
    revealCell(cell, x, y) {
      const ctx = this.canvas;
      if (cell.isRevealed === true) return;
      cell.reveal();
      switch (cell.type) {
        case SHIP_TYPE:
          ctx.beginPath();
          ctx.strokeStyle = "rgb(0,109,178)";
          ctx.lineWidth = 1;
          ctx.moveTo(x * this.cellSize + 5, y * this.cellSize + 5);
          ctx.lineTo(x * this.cellSize + 25, y * this.cellSize + 25);
          ctx.stroke();
          ctx.moveTo(x * this.cellSize + 25, y * this.cellSize + 5);
          ctx.lineTo(x * this.cellSize + 5, y * this.cellSize + 25);
          ctx.stroke();
          break;
        case WATER_TYPE:
        case NEIGHBOR_TYPE:
          ctx.beginPath();
          ctx.strokeStyle = "rgb(130,109,178)";
          ctx.lineWidth = 2;
          ctx.arc(
            x * this.cellSize + 15,
            y * this.cellSize + 15,
            3,
            0,
            2 * Math.PI
          );
          ctx.stroke();
          break;
      }
    }

    // checking possible directions and return array of possible directions
    checkDirections(decks, col, row) {
      const directions = {
        up: [-1, 0],
        right: [0, 1],
        down: [1, 0],
        left: [0, -1],
      };

      const availableDirections = [];

      for (const [direction, offset] of Object.entries(directions)) {
        let isAvailable = true;
        let currentCol = col;
        let currentRow = row;
        for (let i = 0; i < decks; i++) {
          if (
            currentCol < 0 ||
            currentCol > 9 ||
            currentRow < 0 ||
            currentRow > 9
          ) {
            isAvailable = false;
            break;
          }
          if (this.board[currentCol][currentRow].type !== WATER_TYPE) {
            isAvailable = false;
            break;
          }
          currentCol += offset[0];
          currentRow += offset[1];
        }
        if (isAvailable) {
          availableDirections.push(offset);
        }
      }
      return availableDirections;
    }

    // set cells around ship with type NEIGHBOR_TYPE
    fillNeighbor(col, row, id) {
      if (
        this.board[col] &&
        this.board[col][row] &&
        this.board[col][row].type !== SHIP_TYPE
      ) {
        this.board[col][row].type = NEIGHBOR_TYPE;
        this.board[col][row].addNeighorId(id);
      }
    }

    //let's place ships on board;
    placeShips() {
      this.ships.forEach((ship) => {
        let shipIsPlaced = false;

        while (!shipIsPlaced) {
          const col = Math.floor(Math.random() * this.boardSize);
          const row = Math.floor(Math.random() * this.boardSize);

          if (this.board[col][row].type !== WATER_TYPE) {
            continue;
          }

          const availableDirections = this.checkDirections(
            ship.decks,
            col,
            row
          );

          if (availableDirections.length === 0) {
            continue;
          }

          const offset =
            availableDirections[
              Math.floor(Math.random() * availableDirections.length)
            ];

          for (let i = 0; i < ship.decks; i++) {
            this.board[col + offset[0] * i][
              row + offset[1] * i
            ].type = SHIP_TYPE;
            this.board[col + offset[0] * i][row + offset[1] * i].shipId =
              ship.id;
          }

          const crossOffset = [offset[1], offset[0]];

          for (let i = -1; i < ship.decks + 1; i++) {
            const shipCellCol = col + offset[0] * i;
            const shipCellRow = row + offset[1] * i;
            if (i === -1 || i === ship.decks) {
              this.fillNeighbor(shipCellCol, shipCellRow, ship.id);
            }

            const leftNeighborCol = shipCellCol + crossOffset[0];
            const leftNeighborRow = shipCellRow + crossOffset[1];
            this.fillNeighbor(leftNeighborCol, leftNeighborRow, ship.id);

            const rightNeighborCol = shipCellCol - crossOffset[0];
            const rightNeighborRow = shipCellRow - crossOffset[1];
            this.fillNeighbor(rightNeighborCol, rightNeighborRow, ship.id);
          }
          shipIsPlaced = true;
        }
      });
    }
  }

  class Ship {
    constructor(decks, id) {
      this.id = id;
      this.decks = decks; // number of decks (paluba)
      this.hitDecks = 0;
      this.destroyed = false;
    }
    hit() {
      this.hitDecks++;
      if (this.hitDecks === this.decks) {
        this.destroyed = true;
      }
    }
  }

  class Cell {
    constructor(type) {
      this.isRevealed = false;
      this.type = type; //can be "ship" || "water" || "neighbor" (neighbor means water neighbour with ship)
      this.shipId = null;
      this.neighborIds = []; // if cell is neighbour to one or several ships it will contain id of ship.
    }
    addNeighorId(id) {
      this.neighborIds.push(id);
    }
    reveal() {
      this.isRevealed = true;
    }
  }

  const battleField = document.getElementById("battlefield");
  const restart = document.getElementById("newGame");

  let game = new Game(battleField);

  battleField.addEventListener("click", (event) => {
    game.fire(event.offsetX, event.offsetY);
  });
  restart.addEventListener("click", () => {
    game = new Game(battleField);
  });
})();

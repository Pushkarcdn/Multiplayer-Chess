const socket = io();

const chess = new Chess();

const boardElement = document.querySelector(".chessboard");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

const renderboard = () => {

    const board = chess.board();

    boardElement.innerHTML = "";

    board.forEach((row, rowindex) => {

        row.forEach((square, squareindex) => {

            const squareElement = document.createElement("div");

            squareElement.classList.add(
                "square",
                (rowindex + squareindex) % 2 === 0 ? "light" : "dark"
            );

            squareElement.dataset.row = rowindex;
            squareElement.dataset.col = squareindex;

            if (square) {

                const pieceElement = document.createElement("div");

                pieceElement.classList.add(
                    "piece",
                    square.color === "w" ? "white" : "black",
                );

                pieceElement.innerText = getPieceUnicode(square);
                pieceElement.draggable = playerRole === square.color;

                pieceElement.addEventListener("dragstart", (e) => {

                    if (pieceElement.draggable) {
                        draggedPiece = pieceElement;
                        sourceSquare = {
                            row: rowindex,
                            col: squareindex
                        }
                        e.dataTransfer.setData("text/plain", "");
                    }
                });

                pieceElement.addEventListener("dragend", (e) => {
                    draggedPiece = null;
                    sourceSquare = null;
                });

                squareElement.appendChild(pieceElement);

            }

            squareElement.addEventListener("dragover", (e) => {
                e.preventDefault();
            });

            squareElement.addEventListener("drop", (e) => {

                e.preventDefault();

                if (!draggedPiece) return;

                const targetSquare = {
                    row: parseInt(squareElement.dataset.row),
                    col: parseInt(squareElement.dataset.col)
                }

                const move = {
                    from: {
                        row: sourceSquare.row,
                        col: sourceSquare.col
                    },
                    to: {
                        row: targetSquare.row,
                        col: targetSquare.col
                    }
                }

                handleMove(sourceSquare, targetSquare);


            });

            boardElement.appendChild(squareElement);

        });

    });

    if (playerRole === 'b') {
        boardElement.classList.add("flipped");
    } else {
        boardElement.classList.remove("flipped");
    }

}

const handleMove = (source, target) => {

    const move = {
        from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
        to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
        promotion: "q"
    }

    socket.emit("move", move);

}

const getPieceUnicode = (piece) => {
    const unicodePieces = {
        p: "\u2659",
        r: "\u2656",
        n: "\u2658",
        b: "\u2657",
        q: "\u2655",
        k: "\u2654",
        P: "\u265F",
        R: "\u265C",
        N: "\u265E",
        B: "\u265D",
        Q: "\u265B",
        K: "\u265A"
    };

    return unicodePieces[piece.type] || "";

}

socket.on("playerRole", (role) => {

    console.log("role: ", role);

    playerRole = role;

    renderboard();

});

socket.on("spectatorRole", () => {
    playerRole = null;
    document.querySelector("#role").innerText = "You are a spectator";
    renderboard();
})

socket.on("boardState", (fen) => {
    chess.load(fen);
    renderboard();
});

socket.on("move", (move) => {
    chess.move(move);
    renderboard();
});

socket.on("message", (message) => {
    document.querySelector("#message").innerText = message;
});

socket.on("connection", (msg) => {

    if(playerRole === 'spectator') {
        document.querySelector("#connection").innerText = "";
    }

    document.querySelector("#connection").innerText = msg;

    if (playerRole === 'w') {
        // document.querySelector("#role").innerText = `You are white`;
        document.querySelector("#status").innerText = "Your turn!";
    } else if (playerRole === 'b') {
        // document.querySelector("#role").innerText = `You are black`;
        document.querySelector("#status").innerText = "Opponent's turn!";
    } else {
        document.querySelector("#status").innerText = "";
        document.querySelector("#connection").innerText = "";
    }

});

socket.on("turn", (turn) => {

    if (!playerRole) return

    if (playerRole === turn) {
        document.querySelector("#status").innerText = "Your turn";
    } else {
        document.querySelector("#status").innerText = "Opponent's turn";
    }

});

renderboard();
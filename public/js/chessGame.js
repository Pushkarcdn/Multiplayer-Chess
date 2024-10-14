const socket = io();

const chess = new Chess();

const boardElement = document.querySelector(".chessboard");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

const renderboard = () => {
    const board = chess.board();
    boardElement.innerHTML = "";

    let targetSquare = null; // To store the target square during touchmove

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
                    square.color === "w" ? "white" : "black"
                );

                pieceElement.innerText = getPieceUnicode(square);
                pieceElement.draggable = playerRole === square.color;

                // Mouse drag events
                pieceElement.addEventListener("dragstart", (e) => {
                    if (pieceElement.draggable) {
                        draggedPiece = pieceElement;
                        sourceSquare = {
                            row: rowindex,
                            col: squareindex
                        };
                        e.dataTransfer.setData("text/plain", "");
                    }
                });

                pieceElement.addEventListener("dragend", () => {
                    draggedPiece = null;
                    sourceSquare = null;
                });

                // Touch start event
                pieceElement.addEventListener("touchstart", (e) => {
                    if (pieceElement.draggable) {
                        draggedPiece = pieceElement;
                        sourceSquare = {
                            row: rowindex,
                            col: squareindex
                        };
                        e.preventDefault(); // Prevent scrolling on touch
                    }
                });

                // Append the piece to the square
                squareElement.appendChild(pieceElement);
            }

            // Handle dragover for mouse drop
            squareElement.addEventListener("dragover", (e) => {
                e.preventDefault();
            });

            // Handle mouse drop
            squareElement.addEventListener("drop", (e) => {
                e.preventDefault();
                if (!draggedPiece) return;

                const targetSquare = {
                    row: parseInt(squareElement.dataset.row),
                    col: parseInt(squareElement.dataset.col)
                };
                handleMove(sourceSquare, targetSquare);
            });

            // Track the target square during touch move without moving the piece
            squareElement.addEventListener("touchmove", (e) => {
                e.preventDefault(); // Prevent default scrolling behavior
                const touch = e.touches[0];
                const target = document.elementFromPoint(touch.clientX, touch.clientY);

                if (target && target.classList.contains('square')) {
                    targetSquare = {
                        row: parseInt(target.dataset.row),
                        col: parseInt(target.dataset.col)
                    };
                }
            });

            // Perform the move when the user lifts their finger (touchend)
            squareElement.addEventListener("touchend", () => {
                if (!draggedPiece || !targetSquare) return;

                handleMove(sourceSquare, targetSquare);

                // Reset after the move
                draggedPiece = null;
                sourceSquare = null;
                targetSquare = null;
            });

            boardElement.appendChild(squareElement);
        });
    });

    if (playerRole === 'b') {
        boardElement.classList.add("flipped");
    } else {
        boardElement.classList.remove("flipped");
    }
};

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
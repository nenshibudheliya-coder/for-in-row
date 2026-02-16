import React, { useState, useEffect, useRef } from 'react';
import { RotateCcw, Trophy, Bot, User, Globe, Users, Monitor, Home } from 'lucide-react';

const WIDTH = 1200;
const HEIGHT = 600;

const FourInARow = () => {
  const ROWS = 6;
  const COLS = 7;
  const EMPTY = null;
  const PLAYER1 = 'player1';
  const PLAYER2 = 'player2';

  const SKINS = [
    '#e53935', '#880e4f', '#9c27b0', '#4a148c', '#3f51b5', '#00bcd4', '#4caf50',
    '#8bc34a', '#ffeb3b', '#ff9800', '#e65100', '#e91e63', '#f8bbd0', '#795548'
  ];

  const [gameState, setGameState] = useState('menu'); // 'menu', 'skin-select', 'playing'
  const [gameMode, setGameMode] = useState(null); // 'local', 'ai'
  const [playerColors, setPlayerColors] = useState({ player1: '#e63946', player2: '#ffb703' });
  const [playerNames, setPlayerNames] = useState({ player1: 'Player 1', player2: 'Player 2' }); // 05-02 --coloradd//
  const [board, setBoard] = useState(Array(ROWS).fill(null).map(() => Array(COLS).fill(EMPTY)));
  const [currentPlayer, setCurrentPlayer] = useState(PLAYER1);
  const [winner, setWinner] = useState(null);
  const [winningCells, setWinningCells] = useState([]);
  const [hoveredCol, setHoveredCol] = useState(null);
  const [animatingPiece, setAnimatingPiece] = useState(null);
  const [scores, setScores] = useState({ player1: 0, player2: 0 });
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [gameOverPending, setGameOverPending] = useState(false); // 05-02 --delay//
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : WIDTH); //07-02 --responsive//

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);

    // // Attempt to lock orientation to portrait
    // try {
    //   if (screen.orientation && screen.orientation.lock) {
    //     screen.orientation.lock('portrait').catch(() => { });
    //   }
    // } catch (e) { }

    return () => window.removeEventListener('resize', handleResize);
  }, []); //

  const canvasRef = useRef(null);
  const initialSettings = useRef({ colors: null, names: null });


  // Constants for board drawing
  const boardWidth = 740; // Optimized for 1200px width
  const boardHeight = 490;
  const marginX = (WIDTH - boardWidth) / 2;
  const marginY = 110;
  const cellWidth = boardWidth / COLS;
  const cellHeight = boardHeight / ROWS;
  const padding = 10;
  const radius = Math.min(cellWidth, cellHeight) / 2 - padding;

  const checkWinner = (board, row, col, player) => {
    const directions = [
      { dr: 0, dc: 1 },  // horizontal
      { dr: 1, dc: 0 },  // vertical
      { dr: 1, dc: 1 },  // diagonal down-right
      { dr: 1, dc: -1 }  // diagonal down-left
    ];

    for (let { dr, dc } of directions) {
      let cells = [[row, col]];
      for (let i = 1; i < 4; i++) {
        const r = row + dr * i;
        const c = col + dc * i;
        if (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === player) {
          cells.push([r, c]);
        } else break;
      }
      for (let i = 1; i < 4; i++) {
        const r = row - dr * i;
        const c = col - dc * i;
        if (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === player) {
          cells.unshift([r, c]);
        } else break;
      }
      if (cells.length >= 4) return cells.slice(0, 4);
    }
    return null;
  };





  const getValidMoves = (tempBoard) => {
    const moves = [];
    for (let c = 0; c < COLS; c++) {
      if (tempBoard[0][c] === EMPTY) moves.push(c);
    }
    return moves;
  };

  const getLowestEmptyRow = (tempBoard, col) => {
    for (let r = ROWS - 1; r >= 0; r--) {
      if (tempBoard[r][col] === EMPTY) return r;
    }
    return -1;
  };

  const aiMove = () => {
    const validMoves = getValidMoves(board);
    if (validMoves.length === 0 || winner) return;

    setIsAiThinking(true);

    setTimeout(() => {
      let selectedCol = -1;

      // 1. Check if AI can win
      for (const col of validMoves) {
        const row = getLowestEmptyRow(board, col);
        const tempBoard = board.map(r => [...r]);
        tempBoard[row][col] = PLAYER2;
        if (checkWinner(tempBoard, row, col, PLAYER2)) {
          selectedCol = col;
          break;
        }
      }

      // 2. Check if player can win and block them
      if (selectedCol === -1) {
        for (const col of validMoves) {
          const row = getLowestEmptyRow(board, col);
          const tempBoard = board.map(r => [...r]);
          tempBoard[row][col] = PLAYER1;
          if (checkWinner(tempBoard, row, col, PLAYER1)) {
            selectedCol = col;
            break;
          }
        }
      }

      // 3. Pick random move if no priority
      if (selectedCol === -1) {
        selectedCol = validMoves[Math.floor(Math.random() * validMoves.length)];
      }

      setIsAiThinking(false);
      dropPiece(selectedCol);
    }, 1000);
  };

  // AI Trigger
  useEffect(() => {
    if (gameMode === 'ai' && currentPlayer === PLAYER2 && !winner && !animatingPiece && !isAiThinking && !gameOverPending) {
      aiMove();
    }
  }, [currentPlayer, winner, animatingPiece, isAiThinking, gameMode]);

  const dropPiece = (col) => {
    if (winner || animatingPiece || gameOverPending) return; // 05-02 --delay//

    const row = getLowestEmptyRow(board, col);
    if (row === -1) return;

    // Start animation
    const startTime = performance.now();
    const duration = 600;
    const startY = -cellHeight;
    const endY = marginY + row * cellHeight + cellHeight / 2;

    setAnimatingPiece({
      col,
      row,
      player: currentPlayer,
      startY,
      endY,
      startTime
    });

    setTimeout(() => {
      const newBoard = board.map(r => [...r]);
      newBoard[row][col] = currentPlayer;
      setBoard(newBoard);
      setAnimatingPiece(null);

      const winCells = checkWinner(newBoard, row, col, currentPlayer);
      if (winCells) {
        setWinningCells(winCells);
        setGameOverPending(true); // 05-02 --delay//
        setTimeout(() => {
          setWinner(currentPlayer);
          setScores(prev => ({ ...prev, [currentPlayer]: prev[currentPlayer] + 1 }));
          setGameOverPending(false);
        }, 1000);
      } else {
        const isFull = newBoard.every(row => row.every(cell => cell !== EMPTY));
        if (isFull) {
          setGameOverPending(true); // 05-02 --delay//
          setTimeout(() => {
            setWinner('draw');
            setGameOverPending(false);
          }, 1000);
        } else {
          setCurrentPlayer(currentPlayer === PLAYER1 ? PLAYER2 : PLAYER1);
        }
      }
    }, duration);
  };

  const resetGame = () => {
    setBoard(Array(ROWS).fill(null).map(() => Array(COLS).fill(EMPTY)));
    setCurrentPlayer(PLAYER1);
    setWinner(null);
    setWinningCells([]);
    setAnimatingPiece(null);
    setIsAiThinking(false);
    setGameOverPending(false); // 05-02 --delay//
  };

  const exitToMenu = () => {
    resetGame();
    setScores({ player1: 0, player2: 0 }); // 05-02 --score reset//
    setPlayerNames({ player1: 'Player 1', player2: 'Player 2' }); // 05-02 --name reset//
    setPlayerColors({ player1: '#e63946', player2: '#ffb703' }); // 05-02 --color reset//
    setGameState('menu');
    setGameMode(null);
  };

  const cancelSetup = () => {
    if (initialSettings.current.colors) setPlayerColors({ ...initialSettings.current.colors }); // 05-02 --cancelbutton//
    if (initialSettings.current.names) setPlayerNames({ ...initialSettings.current.names }); //05-02 --cancelbutton//
  };

  const backToMenu = () => { //05-02 --cancelbutton//
    cancelSetup(); //05-02 --cancelbutton//
    exitToMenu();
  };

  const startPlaying = (mode) => {
    setGameMode(mode);
    initialSettings.current = { colors: { ...playerColors }, names: { ...playerNames } };
    if (mode === 'local') { // 05-02 --coloradd//
      setGameState('two-player-setup');
    } else {
      setGameState('skin-select');
    }
  };

  const selectColor = (color) => {
    setPlayerColors({
      player1: color,
      player2: color === '#ffb703' ? '#e63946' : '#ffb703'
    });
    // setGameState('playing'); ////
  };

  const handleCanvasClick = (e) => {
    if (winner || animatingPiece || gameOverPending) return; // 05-02 --delay//
    if (gameMode === 'ai' && currentPlayer === PLAYER2) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = WIDTH / rect.width;
    const x = (e.clientX - rect.left) * scaleX;

    if (x >= marginX && x <= marginX + boardWidth) {
      const col = Math.floor((x - marginX) / cellWidth);
      dropPiece(col);
    }
  };

  const handleMouseMove = (e) => {
    if (gameMode === 'ai' && currentPlayer === PLAYER2) {
      setHoveredCol(null);
      return;
    }
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = WIDTH / rect.width;
    const x = (e.clientX - rect.left) * scaleX;

    if (x >= marginX && x <= marginX + boardWidth) {
      setHoveredCol(Math.floor((x - marginX) / cellWidth));
    } else {
      setHoveredCol(null);
    }
  };

  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;

    const render = () => {
      ctx.clearRect(0, 0, WIDTH, HEIGHT);

      // Draw Board Background
      ctx.fillStyle = '#2d6a4f';
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(marginX, marginY, boardWidth, boardHeight, 20);
      } else {
        ctx.rect(marginX, marginY, boardWidth, boardHeight);
      }
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw Column Hover
      if (hoveredCol !== null && !winner && !animatingPiece) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.fillRect(marginX + hoveredCol * cellWidth, marginY, cellWidth, boardHeight);

        ctx.fillStyle = playerColors[currentPlayer];
        ctx.beginPath();
        ctx.arc(marginX + hoveredCol * cellWidth + cellWidth / 2, marginY - 30, radius * 0.9, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 200) * 0.2;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      }

      // Draw Grid
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const x = marginX + c * cellWidth + cellWidth / 2;
          const y = marginY + r * cellHeight + cellHeight / 2;
          const cell = board[r][c];

          if (cell === EMPTY) {
            ctx.fillStyle = '#fefae0'; // 05-02 --background//
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.stroke();
          } else {
            const isWinning = winningCells.some(([row, col]) => row === r && col === c);
            drawPiece(ctx, x, y, cell, isWinning);
          }
        }
      }

      // Animating Piece
      if (animatingPiece) {
        const { col, startTime, startY, endY, player } = animatingPiece;
        const progress = Math.min((performance.now() - startTime) / 600, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const x = marginX + col * cellWidth + cellWidth / 2;
        const y = startY + (endY - startY) * easeProgress;

        ctx.save();
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(marginX, marginY, boardWidth, boardHeight, 20);
        } else {
          ctx.rect(marginX, marginY, boardWidth, boardHeight);
        }
        ctx.clip();
        drawPiece(ctx, x, y, player, false);
        ctx.restore();
      }

      animationId = requestAnimationFrame(render);
    };


    const drawPiece = (ctx, x, y, player, isWinning) => {
      const color = playerColors[player];
      const secondaryColor = player === PLAYER1 ? '#a62d38' : '#e09d00'; //05-02 --background//

      if (isWinning) {
        ctx.save();
        ctx.shadowColor = color;
        ctx.shadowBlur = 15 + Math.sin(Date.now() / 200) * 10;
        ctx.beginPath();
        ctx.arc(x, y, radius * 1.05, 0, Math.PI * 2);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();
      }

      const gradient = ctx.createRadialGradient(x - radius / 3, y - radius / 3, radius / 5, x, y, radius);
      gradient.addColorStop(0, '#fff');
      gradient.addColorStop(0.2, color);
      gradient.addColorStop(1, '#000');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [board, hoveredCol, currentPlayer, winner, winningCells, animatingPiece, gameState, playerColors]);


  return (
    <>
      {/* Rotate Message Overlay for Landscape Mode on Mobile */}
      {/* Rotate Message Overlay for Landscape Mode on Mobile */}
      <div className="rotate-message" data-enabled="true">
        <svg className="rotate-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect>
          <polyline points="17 2 12 7 7 2"></polyline>
        </svg>
        <h2>Please Rotate Your Device</h2>
        <p>This game works best in portrait mode</p>
      </div>

      <div
        className="main-app-container"
        data-rotate-restricted="true"
        style={{
          minHeight: '100vh',
          background: '#d8f3dc', //05-02 --background-green//
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: '"Outfit", sans-serif',
          padding: '0',
          overflow: 'visible',
          position: 'relative',
          width: '100%'
        }}>
        <div className="game-wrapper" style={{
          width: '100%',
          minHeight: '100vh',
          height: 'auto',
          // aspectRatio: gameState === 'playing' ? '1200 / 600' : 'unset',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          padding: 'clamp(5px, 2vw, 20px)',
          boxSizing: 'border-box'
        }}>
          <div className="bg-spots">
            {[...Array(30)].map((_, i) => {
              const size = i % 3 === 0 ? 'bubble-lg' : i % 3 === 1 ? 'bubble-md' : 'bubble-sm';
              const color = i % 4 === 0 ? 'green-b' : 'white-b';
              return (
                <div key={i} className={`bg-piece ${size} ${color} p-${i + 1}`} />
              );
            })}
          </div>


          {gameState === 'menu' && (
            <div style={{ textAlign: 'center', zIndex: 10, width: '100%', padding: '20px' }}>
              <div className="menu-title">
                <span className="word-4">4</span>
                <span className="word-in">IN</span>
                <span className="word-a">A</span>
                <br />
                <span className="word-row">ROW</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                <button className="menu-btn btn-local" onClick={() => startPlaying('local')}>
                  <Users size={30} /> TWO PLAYER
                </button>
                <button className="menu-btn btn-computer" onClick={() => startPlaying('ai')}>
                  <Monitor size={30} /> PLAY VS COMPUTER
                </button>
              </div>
            </div>
          )}


          {gameState === 'two-player-setup' && (
            <div style={{
              zIndex: 10, display: 'flex', gap: 'clamp(6px, 1.5vw, 12px)', flexWrap: 'wrap', justifyContent: 'center', width: '95%', maxWidth: '850px',
              padding: 'clamp(5px, 1.5vw, 10px) 0', boxSizing: 'border-box'
            }}>
              {/* Player 1 Selection */}
              <div style={{
                background: '#fefae0', padding: 'clamp(0.8rem, 2vw, 1.2rem)', borderRadius: '20px', border: '4px solid #000', flex: '1', minWidth: 'min(280px, 100%)',
                maxWidth: '450px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '10px' }}>
                  <h3 style={{ fontFamily: 'Luckiest Guy', fontSize: 'clamp(1.4rem, 5vw, 1.8rem)', color: '#1b4332', margin: 0 }}>Player 1</h3>
                  <input
                    value={playerNames.player1}
                    onChange={(e) => setPlayerNames(prev => ({ ...prev, player1: e.target.value }))}
                    style={{ background: 'rgba(16, 36, 19, 0.05)', border: '1px solid rgba(0, 0, 0, 0.1)', borderRadius: '10px', padding: '5px 10px', fontFamily: 'Luckiest Guy', width: 'clamp(100px, 35vw, 150px)', color: playerColors.player1, fontSize: '1.2rem' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(40px, 1fr))', gap: '8px' }}>
                  {SKINS.map((color) => { // 07-02 --color//
                    const isSelectedByOther = playerColors.player2 === color;
                    const isSelectedBySelf = playerColors.player1 === color;
                    return (
                      <div
                        key={color}
                        onClick={() => !isSelectedByOther && setPlayerColors(prev => ({ ...prev, player1: color }))} // 07-02 --color//
                        style={{
                          width: windowWidth < 400 ? '30px' : '40px', height: windowWidth < 400 ? '30px' : '40px', borderRadius: '50%', background: color,
                          cursor: isSelectedByOther ? 'not-allowed' : 'pointer',
                          border: isSelectedBySelf ? '4px solid #000' : '2px solid rgba(0, 0, 0, 0.3)',
                          boxShadow: isSelectedBySelf ? '0 0 10px rgba(0, 0, 0, 0.3)' : 'none',
                          transform: isSelectedBySelf ? 'scale(1.1)' : 'scale(1)',
                          opacity: isSelectedByOther ? 0.3 : 1,
                          position: 'relative'
                        }}
                        onMouseEnter={e => !isSelectedByOther && (e.currentTarget.style.transform = 'scale(1.1)')} // 07-02 --colortwo//
                        onMouseLeave={e => e.currentTarget.style.transform = isSelectedBySelf ? 'scale(1.1)' : 'scale(1)'} // 07-02 --colortwo//
                      >
                        {isSelectedByOther && (
                          <div style={{
                            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#111010ff', fontSize: '10px', fontWeight: 'bold'
                          }}>X</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Player 2 Selection */}
              <div style={{
                background: '#fefae0', padding: 'clamp(0.8rem, 2vw, 1.2rem)', borderRadius: '20px', border: '4px solid #000', flex: '1', minWidth: 'min(280px, 100%)',
                maxWidth: '450px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '10px' }}>
                  <h3 style={{ fontFamily: 'Luckiest Guy', fontSize: 'clamp(1.4rem, 5vw, 1.8rem)', color: '#1b4332', margin: 0 }}>Player 2</h3>
                  <input
                    type="text"
                    value={playerNames.player2}
                    onChange={(e) => setPlayerNames(prev => ({ ...prev, player2: e.target.value }))}
                    style={{ background: 'rgba(0, 0, 0, 0.05)', border: '1px solid rgba(0, 0, 0, 0.1)', borderRadius: '10px', padding: '5px 10px', fontFamily: 'Luckiest Guy', width: 'clamp(100px, 35vw, 150px)', color: playerColors.player2, fontSize: '1.2rem' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(40px, 1fr))', gap: '8px' }}>
                  {SKINS.map((color) => { // 07-02 --color//
                    const isSelectedByOther = playerColors.player1 === color;
                    const isSelectedBySelf = playerColors.player2 === color;
                    return (
                      <div
                        key={color}
                        onClick={() => !isSelectedByOther && setPlayerColors(prev => ({ ...prev, player2: color }))} // 07-02 --color//
                        style={{
                          width: windowWidth < 400 ? '30px' : '40px', height: windowWidth < 400 ? '30px' : '40px', borderRadius: '50%', background: color,
                          cursor: isSelectedByOther ? 'not-allowed' : 'pointer',
                          border: isSelectedBySelf ? '4px solid #000' : '2px solid rgba(0, 0, 0, 0.3)',
                          boxShadow: isSelectedBySelf ? '0 0 10px rgba(0, 0, 0, 0.3)' : 'none',
                          transform: isSelectedBySelf ? 'scale(1.1)' : 'scale(1)',
                          opacity: isSelectedByOther ? 0.3 : 1,
                          position: 'relative'
                        }}
                        onMouseEnter={e => !isSelectedByOther && (e.currentTarget.style.transform = 'scale(1.1)')} // 07-02 --colortwo//
                        onMouseLeave={e => e.currentTarget.style.transform = isSelectedBySelf ? 'scale(1.1)' : 'scale(1)'} // 07-02 --colortwo//
                      >
                        {isSelectedByOther && (
                          <div style={{
                            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#000', fontSize: '10px', fontWeight: 'bold'
                          }}>X</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: 'clamp(10px, 3vw, 20px)', marginTop: '1rem', flexWrap: 'wrap' }}>
                <button onClick={backToMenu} style={{ //05-02 --cancelbutton//
                  background: 'linear-gradient(135deg, #e53935 0%, #b71c1c 100%)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.3)', borderRadius: '15px', padding: 'clamp(8px, 1.5vw, 12px) clamp(15px, 4vw, 30px)',
                  fontFamily: 'Luckiest Guy', cursor: 'pointer', boxShadow: '0 8px 20px rgba(0, 0, 0, 0.25)', fontSize: 'clamp(1.1rem, 3.5vw, 1.5rem)', transition: 'transform 0.2s'
                }}>BACK</button>
                <button onClick={() => setGameState('playing')} style={{
                  background: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.3)', borderRadius: '15px', padding: 'clamp(8px, 1.5vw, 12px) clamp(15px, 4vw, 30px)',
                  fontFamily: 'Luckiest Guy', cursor: 'pointer', boxShadow: '0 8px 20px rgba(0, 0, 0, 0.25)', fontSize: 'clamp(1.1rem, 3.5vw, 1.5rem)', transition: 'transform 0.2s'
                }}>START</button>
                <button onClick={cancelSetup} style={{
                  background: 'linear-gradient(135deg, #e53935 0%, #b71c1c 100%)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.3)', borderRadius: '15px', padding: 'clamp(8px, 1.5vw, 12px) clamp(15px, 4vw, 30px)',
                  fontFamily: 'Luckiest Guy', cursor: 'pointer', boxShadow: '0 8px 20px rgba(0, 0, 0, 0.25)', fontSize: 'clamp(1.1rem, 3.5vw, 1.5rem)', transition: 'transform 0.2s'
                }}>CANCEL</button>
              </div>
            </div>
          )}


          {gameState === 'skin-select' && ( // 04-02 --coloradd//
            <div style={{
              zIndex: 10, textAlign: 'center', background: '#f5f5dc', padding: 'clamp(1rem, 3vw, 2rem)', borderRadius: '25px', border: '5px solid #000',
              maxWidth: '500px', width: '90%', position: 'relative', margin: '10px', boxSizing: 'border-box'
            }}>
              <h2 style={{ fontFamily: 'Luckiest Guy', fontSize: 'clamp(1.5rem, 6vw, 2.5rem)', margin: '0 0 1rem 0', color: '#1b5e20' }}>Select Your Skin</h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(35px, 10vw, 45px), 1fr))',
                gap: 'clamp(8px, 2vw, 15px)',
                justifyItems: 'center',
                width: '100%'
              }}>
                {SKINS.map((color) => (
                  <div
                    key={color}
                    onClick={() => selectColor(color)}
                    style={{
                      width: 'clamp(35px, 8vw, 45px)', height: 'clamp(35px, 8vw, 45px)', borderRadius: '50%', background: color, cursor: 'pointer',
                      border: playerColors.player1 === color ? '4px solid #000' : '2px solid rgba(0, 0, 0, 0.3)',
                      boxShadow: playerColors.player1 === color ? '0 0 10px rgba(0, 0, 0, 0.3)' : 'none',
                      transform: playerColors.player1 === color ? 'scale(1.1)' : 'scale(1)' // 07-02 --colortwo//
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseLeave={e => e.currentTarget.style.transform = playerColors.player1 === color ? 'scale(1.1)' : 'scale(1)'} // 07-02 --colortwo//
                  />
                ))}
              </div>
              <div style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: 'clamp(8px, 3vw, 20px)', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                <button onClick={backToMenu} style={{
                  background: 'linear-gradient(135deg, #e53935 0%, #b71c1c 100%)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.3)', borderRadius: '15px', padding: 'clamp(8px, 1.5vw, 12px) clamp(15px, 4vw, 30px)',
                  fontFamily: 'Luckiest Guy', cursor: 'pointer', boxShadow: '0 8px 20px rgba(0, 0, 0, 0.25)', fontSize: 'clamp(1.1rem, 3.5vw, 1.3rem)', transition: 'transform 0.2s'
                }}>BACK</button>
                <button onClick={() => setGameState('playing')} style={{
                  background: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.3)', borderRadius: '15px', padding: 'clamp(8px, 1.5vw, 12px) clamp(15px, 4vw, 30px)',
                  fontFamily: 'Luckiest Guy', cursor: 'pointer', boxShadow: '0 8px 20px rgba(0, 0, 0, 0.25)', fontSize: 'clamp(1.1rem, 3.5vw, 1.3rem)', transition: 'transform 0.2s'
                }}>START</button>
                <button onClick={cancelSetup} style={{
                  background: 'linear-gradient(135deg, #e53935 0%, #b71c1c 100%)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.3)', borderRadius: '15px', padding: 'clamp(8px, 1.5vw, 12px) clamp(15px, 4vw, 30px)',
                  fontFamily: 'Luckiest Guy', cursor: 'pointer', boxShadow: '0 8px 20px rgba(0, 0, 0, 0.25)', fontSize: 'clamp(1.1rem, 3.5vw, 1.3rem)', transition: 'transform 0.2s'
                }}>CANCEL</button>
              </div>
            </div>
          )}


          {/*game working */}
          {gameState === 'playing' && (
            <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '1000px', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px' }}>
              {/* Header */}
              <div style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'clamp(10px, 3vw, 25px)',
                flexWrap: 'nowrap',
                gap: 'clamp(5px, 2vw, 20px)',
                padding: '0 clamp(10px, 4vw, 40px)'
              }}>
                <button onClick={exitToMenu} style={{
                  padding: 'clamp(0.5rem, 1.5vw, 1rem)', background: 'rgba(45, 106, 79, 0.15)', border: 'none', borderRadius: '50%', color: '#000', cursor: 'pointer', transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(45, 106, 79, 0.25)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(45, 106, 79, 0.15)'}>
                  <Home size={28} color="#fffcfcff" style={{ width: 'clamp(20px, 4.5vw, 32px)', height: 'clamp(20px, 4.5vw, 32px)' }} />
                </button>

                <div style={{ display: 'flex', gap: 'clamp(5px, 2vw, 20px)', flexWrap: 'wrap', justifyContent: 'center', flex: 1, minWidth: 0 }}>
                  <PlayerScore icon={<User size={18} />} name={playerNames.player1} score={scores.player1} color={playerColors.player1} active={currentPlayer === PLAYER1 && !winner} />
                  <PlayerScore
                    icon={gameMode === 'ai' ? <Bot size={18} /> : <Users size={18} />}
                    name={gameMode === 'ai' ? "BOT" : playerNames.player2}
                    score={scores.player2}
                    color={playerColors.player2}
                    active={currentPlayer === PLAYER2 && !winner}
                    thinking={isAiThinking}
                  />
                </div>

                <button onClick={resetGame} style={{
                  padding: 'clamp(0.5rem, 1.5vw, 1rem)', background: 'rgba(45, 106, 79, 0.15)', border: 'none', borderRadius: '50%', color: '#000', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(45, 106, 79, 0.25)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(45, 106, 79, 0.15)'}>
                  <RotateCcw size={28} color="#f7f0f0ff" style={{ width: 'clamp(20px, 4.5vw, 32px)', height: 'clamp(20px, 4.5vw, 32px)' }} />
                </button>
              </div>

              {/* Game Canvas Container */}
              <div style={{
                width: '100%',
                maxWidth: '100%',
                height: 'auto',
                maxHeight: windowWidth >= 601 && windowWidth <= 1024 ? '80vh' : '70vh', // 16-02 tablet optimization
                aspectRatio: `${WIDTH} / ${HEIGHT}`,
                background: 'transparent',
                borderRadius: '20px',
                padding: '4px',
                border: 'none',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} style={{
                  width: '100%',
                  height: 'auto',
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  cursor: (winner || (gameMode === 'ai' && currentPlayer === PLAYER2)) ? 'default' : 'pointer',
                  display: 'block',
                  borderRadius: '16px'
                }} onClick={handleCanvasClick} onMouseMove={handleMouseMove} onMouseLeave={() => setHoveredCol(null)} />

                {winner && (
                  <div style={{
                    position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)', borderRadius: '20px', padding: '20px', textAlign: 'center'
                  }}>
                    <div style={{
                      color: winner === 'draw' ? '#fff' : playerColors[winner],
                      fontSize: 'clamp(1.5rem, 8vw, 3rem)', fontWeight: 800, textAlign: 'center', textShadow: `0 0 20px currentColor`, display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', gap: '0.8rem'
                    }}>
                      {winner === 'draw' ? 'DRAW!' : <><Trophy size={40} /> {winner === PLAYER1 ? playerNames.player1 : (gameMode === 'ai' ? 'BOT' : playerNames.player2)} WINS!</>}
                    </div>
                    <button onClick={resetGame} style={{
                      marginTop: '1rem', padding: '0.8rem 2rem', fontSize: 'clamp(1rem, 4vw, 1.2rem)', fontWeight: 700,
                      background: 'linear-gradient(135deg, #2d6a4f 0%, #1b4332 100%)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.3)', borderRadius: '50px',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s', boxShadow: '0 10px 20px rgba(0,0,0,0.3)'
                    }}> <RotateCcw size={18} /> RESET GAME </button>
                  </div>
                )}
              </div>

              {/* <div className="game-status" style={{ marginTop: '0.6rem', color: '#f7ededff', opacity: 0.9, fontWeight: 700, fontSize: 'clamp(0.8rem, 3vw, 1.1rem)' }}>
              {gameMode === 'ai' && currentPlayer === PLAYER2 ? '🤖 Bot AI thinking...' : `🎮 ${currentPlayer === PLAYER1 ? playerNames.player1 : playerNames.player2}'s turn`}
            </div> */}
            </div>
          )}
        </div>
      </div>
    </>
  );
};


// score working ///
const PlayerScore = ({ icon, name, score, color, active, thinking }) => (
  <div style={{
    background: active ? `${color}44` : 'rgba(255, 255, 255, 0.05)',
    border: `3px solid ${active ? color : 'transparent'}`,
    borderRadius: '16px', padding: 'clamp(0.4rem, 1vw, 0.8rem) clamp(0.5rem, 2vw, 1.2rem)', transition: 'all 0.3s ease',
    transform: active ? 'scale(1.05)' : 'scale(1)', boxShadow: active ? `0 0 20px ${color}33` : 'none',
    minWidth: 'clamp(90px, 20vw, 120px)', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: 'clamp(0.6rem, 2vw, 0.8rem)', color: '#fff', textTransform: 'uppercase', fontWeight: 'bold', width: '100%', justifyContent: 'center' }}>
      {icon} <span style={{ display: 'inline-block', maxWidth: 'min(100px, 25vw)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
    </div>
    <div style={{ fontSize: 'clamp(1.2rem, 4vw, 1.8rem)', fontWeight: 900, color: '#fff', fontStyle: 'normal' }}>{score}</div>
    {thinking && (
      <div style={{ position: 'absolute', top: -10, right: -10, background: color, color: '#fff', padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 'bold' }}>
        ...
      </div>
    )}
  </div>
);

export default FourInARow;
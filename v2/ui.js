class UI {
  constructor(scene, playerHealth = 0) {
    this.scoreText = scene.add.text(16, 16, "Score: 0", {
      fontSize: "32px",
      fill: "#fff",
    });
    this.scoreText.visible = false;

    // Create Game Over Text
    this.gameOverText = scene.add.text(250, 250, "GAME OVER", {
      fontSize: "48px",
      fill: "#ff0000",
    });
    this.gameOverText.visible = false;

    // Create Menu Text
    this.menuText = scene.add.text(250, 150, "Shooter Game", {
      fontSize: "48px",
      fill: "#fff",
    });

    this.cursors = scene.input.keyboard.addKeys("W,A,S,D");

    // Create player health text
    this.playerHealth = scene.add.text(16, 50, `Health: ${playerHealth}`, {
      fontSize: "24px",
      fill: "#fff",
    });
    this.playerHealth.visible = false;

    // Create Start Button
    this.startButton = scene.add.text(325, 300, "START", {
      fontSize: "32px",
      fill: "#fff",
    });
    this.startButton.setInteractive();
    this.startButton.on("pointerdown", () => {
      gameStarted = true;
      player.visible = true;
      this.playerHealth.visible = true;
      this.scoreText.visible = true;

      this.hide();
    });
  }

  updateScore(score) {
    this.scoretext.setText("Score: " + score);
  }

  updateHealth(health) {
    this.playerHealth.setText(`Health: ${health}`);
  }

  hide() {
    const hideElements = [this.gameOverText, this.menuText, this.startButton];

    for (const element of hideElements) {
      element.visible = false;
    }
  }
}

function Play(game) {
    this.game = game;
    this.middleGround = null;
    this.grounds = null;
    this.platforms = null;
    this.clouds = null;
    this.bullets = null;
    this.player = null;
    this.bones = null;
    this.spikes = null;

    this.scoreText = null;
    this.speedText = null;
    this.levelUpText = null;
    this.gameOverText = null;
    this.levelStartText = null;

    this.score = 0;
    this.game.speed = 420;
    this.levels = [];
    this.currentLevel = 0;
    this.levelGroup = 0;

    this.dyingAnimation = 0;
    this.levelUpAnimation = -1;

    this.coinSfx = null;
    this.bgMusic = null;
    this.levelUpSfx = null;
};

Play.prototype.preload = function() {
    this.game.load.atlasJSONHash('harrison', 'assets/harrison.png', 'assets/harrison.json');
    this.game.load.atlasJSONHash('dog', 'assets/dog.png', 'assets/dog.json');

    this.game.load.image('ground', 'assets/ground.png');
    this.game.load.image('longPlatform', 'assets/longPlatform.png');
    this.game.load.image('medPlatform', 'assets/medPlatform.png');
    this.game.load.image('smallPlatform', 'assets/smallPlatform.png');
    this.game.load.image('stepPlatform', 'assets/stepPlatform.png');
    this.game.load.image('bone', 'assets/bone.png');
    this.game.load.image('background', 'assets/bg.png');
    this.game.load.image('bullet', 'assets/bullet.png');
    this.game.load.image('trees', 'assets/trees.png');
    this.game.load.image('spike', 'assets/spike.png');
    this.game.load.image('cloud-platform', 'assets/cloud-platform.png');

    this.game.load.audio('jump', 'assets/jump.mp3');
    this.game.load.audio('slide', 'assets/laserSlide.mp3');
    this.game.load.audio('coin', 'assets/coinCollect.mp3');
    this.game.load.audio('die', 'assets/happyDeathJingle.mp3');
    this.game.load.audio('bgMusic', 'assets/bgMusic.mp3');
    this.game.load.audio('levelUp', 'assets/levelUp.mp3');

    this.game.load.json('levels', 'levels/levels.json');

    // this.game.scale.scaleMode = Phaser.ScaleManager.RESIZE;
    // this.game.scale.pageAlignHorizontally = true;
    this.game.scale.pageAlignVertically = true;
    // this.game.scale.setScreenSize(true);
};

Play.prototype.create = function() {
    this.game.physics.startSystem(Phaser.Physics.ARCADE);
    this.game.background = this.game.add.tileSprite(0, 0, 1920, 1080, 'background');
    this.middleGround = this.game.add.tileSprite(0, this.game.world.height - 140 - 125, 1920, 140, 'trees');

    this.resetConfig();
    this.setupGameTexts();
    this.setupSprites();
    this.setupSfx();
};

Play.prototype.update = function() {
    this.handleBounds();

    if (!this.player.alive && !this.dyingAnimation) {
        this.dyingAnimation = 90;
        this.game.add.tween(this.gameOverText).to({alpha : 1}, 200, Phaser.Easing.Linear.None, false, 0, -1, false);
        this.bgMusic.stop();
    } else if (this.dyingAnimation === 1) {
        this.game.state.start("Play");
    } else if (this.dyingAnimation) {
        this.dyingAnimation--;
        return;
    }

    this.scoreText.text = 'Score: ' + Math.floor(this.score);
    this.speedText.text = 'Speed: ' + Math.floor(this.game.speed);

    this.handleLevels();
};

Play.prototype.resetConfig = function() {
    this.levels = this.game.cache.getJSON('levels');
    this.score = 0;
    this.currentLevel = 0;
    this.levelGroup = 0;
    this.dyingAnimation = 0;
    this.game.speed = 420;
    this.levelUpAnimation = -1;
};

Play.prototype.setupGameTexts = function() {
    this.scoreText = this.game.add.text(16, 16, 'Score: 0', {fontSize: '32px', fill: '#000'});
    this.speedText = this.game.add.text(16, 50, 'Speed: ' + this.game.speed, {fontSize: '32px', fill: '#000'});
    this.game.add.text(16, 90, 'v1.08', {fontSize: '32px', fill: '#000'});

    this.levelUpText = this.game.add.text(this.game.width/2 - 295, this.game.height/2 - 200, 'LEVEL UP!!!', {fontSize: '100px', fill: '#000'});
    this.levelUpText.alpha = 0;

    this.levelStartText = this.game.add.text(this.game.width/2 - 215, this.game.height/2 - 200, 'LEVEL 1', {fontSize: '100px', fill: '#000'});
    this.levelStartText.alpha = 0;
    
    this.gameOverText = this.game.add.text(this.game.width/2 - 330, this.game.height/2 - 200, 'GAME OVER!!!', {fontSize: '100px', fill: '#000'});
    this.gameOverText.alpha = 0;
};

Play.prototype.setupSfx = function() {
    this.levelUpSfx = this.game.add.audio('levelUp');
    this.coinSfx = this.game.add.audio('coin');
    this.bgMusic = this.game.add.audio('bgMusic');
    this.bgMusic.loop = true;
    this.game.sound.setDecodedCallback([this.bgMusic], function() {
        // this.bgMusic.play();
    }, this);
};

Play.prototype.setupSprites = function() {
    this.clouds = this.game.add.physicsGroup();
    this.platforms = this.game.add.group();
    this.grounds = this.game.add.group();
    this.bullets = this.game.add.group();
    this.spikes = this.game.add.group();
    this.bones = this.game.add.group();

    this.player = new Player(this.game, {
        "jump" : this.game.add.audio('jump'),
        "slide" : this.game.add.audio('slide'),
        "die" : this.game.add.audio('die')
    });
    this.dog = new Dog(this.game, {});

    var ground = new MovingStationaryObject(this.game, 0, this.game.world.height - 125, 'ground', this.grounds);
    var scale = gameWidth / 71 + 1;
    ground.scale.setTo(scale, 1);
};

Play.prototype.handleBounds = function() {
    this.game.physics.arcade.collide(this.bones, this.grounds);
    this.game.physics.arcade.collide(this.bones, this.platforms);
    this.game.physics.arcade.collide(this.player, this.grounds);
    // this.game.physics.arcade.collide(this.dog, this.platforms);
    this.game.physics.arcade.collide(this.dog, this.grounds);

    if (this.levelUpAnimation < 0) {
        this.game.physics.arcade.collide(this.player, this.platforms);
        this.game.physics.arcade.collide(this.player, this.clouds);
    }
};

Play.prototype.clearLevel = function () { 
    var len = this.platforms.children.length;
    for (var i = 0; i < len; i++) {
        this.platforms.children[0].destroy();
    }

    len = this.bullets.children.length;
    for (var i = 0; i < len; i++) {
        this.bullets.children[0].destroy();
    }

    len = this.bones.children.length;
    for (var i = 0; i < len; i++) {
        this.bones.children[0].destroy();
    }

    len = this.spikes.children.length;
    for (var i = 0; i < len; i++) {
        this.spikes.children[0].destroy();
    }
};

Play.prototype.startLevelUpAnimation = function() {
    if (this.currentLevel === 3) {

    } else {
        this.currentLevel++;
    }

    this.levelGroup = 0;
    this.levelUpAnimation = 260;

    this.game.speed = 0;
    this.player.levelTransitioning = true;

    this.levelUpSfx.play();

    this.game.add.tween(this.levelUpText).to({alpha : 1}, 200, Phaser.Easing.Linear.None, true, 0, 3, true);
};

Play.prototype.finishLevelUpAnimation = function() {
    this.clearLevel();

    this.game.speed = 500;
    this.player.levelTransitioning = false;
    this.player.respawn();
    this.dog.respawn();

    this.levelStartText.text = "LEVEL " + (this.currentLevel + 1);
    this.game.add.tween(this.levelStartText).to({alpha : 1}, 200, Phaser.Easing.Linear.None, true, 0, 2, true);

    this.levelUpAnimation--;
};

Play.prototype.doLevelUpAnimation = function() {
    if (this.levelUpAnimation === 120) {
        this.game.add.tween(this.game.world).to({alpha : 0}, 2000, Phaser.Easing.Linear.None, true, 0, 0, true);
    }
    this.levelUpAnimation--;
};

Play.prototype.handleLevels = function() {
    if ((this.score > 500 && this.currentLevel === 0) ||
        (this.score > 1000 && this.currentLevel === 1) ||
        (this.score > 2000 && this.currentLevel === 2)) {
        
        this.startLevelUpAnimation();
    } else if (this.levelUpAnimation > 0) {
        this.doLevelUpAnimation();
    } else if (this.levelUpAnimation === 0) {
        this.finishLevelUpAnimation();
    } else {
        this.score += 1 / 60;
        this.game.speed += 2 / 60;

        this.game.background.tilePosition.x -= 1;
        this.middleGround.tilePosition.x -= 2;

        this.generateLevelSprites();

        var self = this;
        this.game.physics.arcade.overlap(this.player, this.bullets, function() {
            self.player.kill();
        });
        this.game.physics.arcade.overlap(this.player, this.spikes, function() {
            self.player.kill();
        });
        this.game.physics.arcade.overlap(this.player, this.bones, function(player, bone) {
            self.score += 50;
            self.coinSfx.play();
            bone.destroy();
        });
    }
};

Play.prototype.generateLevelSprites = function() {
    if (this.platforms.length === 0 
    || (this.platforms.children[this.platforms.length - 1].x + this.platforms.children[this.platforms.length - 1].width < this.game.world.width)) {
        var nextGroup = this.levels[this.currentLevel][this.levelGroup];
        var x = this.game.world.width + nextGroup.spacingBefore * 70 + 70;
        var y = this.game.world.height - 125 - nextGroup.heightLevel * 150;

        var platform = new MovingStationaryObject(this.game, x, y, nextGroup.platform, this.platforms);

        for (var i = 0; i < nextGroup.bones; i++) {
            var bone = new MovingStationaryObject(this.game, x + i * 100 - 60, y - 60, "bone", this.bones);
        }

        if (nextGroup.spikes) {
            for (var i = 0; i < nextGroup.spikes.length; i++) {
                var spike = new MovingStationaryObject(this.game, x + nextGroup.spikes[i].x, y + nextGroup.spikes[i].y - 50, "spike", this.spikes);
                spike.scale.setTo(0.4, 0.4);
            }
        }

        if (nextGroup.bullets) {
            for (var i = 0; i < nextGroup.bullets.length; i++) {
                var bullet = new EnemyBullet(this.game, x + nextGroup.bullets[i].x, y + nextGroup.bullets[i].y, "bullet", this.bullets);
                bullet.scale.setTo(0.25, 0.25);
            }
        }

        this.levelGroup++;
        if (this.levelGroup === this.levels[this.currentLevel].length) {
            this.levelGroup = 0;
        }
    }
    this.generateGround();
};

Play.prototype.generateGround = function() {
    var hasground = false;
    for (var i = 0; i < this.grounds.length; i++) {
        if (this.grounds.children[i].x > 0) {
            hasground = true;
        }
    }
    if (!hasground) {
        var ground = new MovingStationaryObject(this.game, this.game.world.width, this.game.world.height - 125, 'ground', this.grounds);
        var scale = gameWidth / 71 + 1;
        ground.scale.setTo(scale, 1);
    }
};

// window.onresize = function () {
//     console.log("resize");  
//     game.scale.scaleMode = Phaser.ScaleManager.RESIZE;
// }
var Branch = function (parent, topWidth, bottomWidth, growthSpeed, colour, dying, lifespan) {
	this.topWidth = topWidth;
	this.growthSpeed = growthSpeed;
	this.dying = dying;
	this.lifespan = lifespan;
	this.mesh = new THREE.Mesh(
		new THREE.CylinderGeometry(topWidth, bottomWidth, 1, 10), 
		new THREE.MeshBasicMaterial({color : colour})
	);
	this.mesh.geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, 0.5, 0));
	this.mesh.geometry.dynamic = true;
	this.mesh.geometry.verticesNeedUpdate = true;
	this.mesh.position.y = -100;
	parent.add(this.mesh);
	console.log('branch created');
};

Branch.prototype.bend = function () {

};

Branch.prototype.grow = function () {
	if (this.dying) {
		if (this.lifespan > 0) {
			this.lifespan--;
		} else {
			return;
		}
	}
	this.mesh.geometry.verticesNeedUpdate = true;
	this.mesh.geometry.vertices[this.mesh.geometry.vertices.length - 2].y += this.growthSpeed;
	for (var i = 0; i < this.mesh.geometry.vertices.length/2 - 1; i++) {
		this.mesh.geometry.vertices[i].y += this.growthSpeed;
	}
};

Branch.prototype.setGrowthSpeed = function (growthSpeed) {
	this.growthSpeed = growthSpeed;
};

Branch.prototype.getHeight = function () {
	return this.mesh.geometry.vertices[0].y;
};

/////////////////////////////////////////////////////////////////////////////
var MAX_GENS = 8;
var GEN_WIDTH_DIFF = 3;
var STARTING_WIDTH = 15;
var BASE_SPEED = 1.1;
var GEN_WIDTH_DIFFS = [7, 4, 2, 0, 0 ,0 ,0 ,0];
var Tree = function (scene) {
	// trunk is first generation
	this.generations = [[new Branch(
		scene,
		STARTING_WIDTH - GEN_WIDTH_DIFFS[0], 
		STARTING_WIDTH, 
		BASE_SPEED, 
		"rgb(128, 64, 0)",
		false,
		0
	)]];
};

Tree.prototype.grow = function () {
	// only grow last generation up to MAX_GENS
	if (this.generations.length < MAX_GENS) {
		this.generations[this.generations.length - 1].forEach(function (branch) {
			branch.grow();
		});
	}
};

Tree.prototype.getRandomGrowthSpeed = function () {
	return BASE_SPEED - Math.random() * this.generations.length / MAX_GENS;
};

Tree.prototype.getRandomDirection = function (index) {
	var x, z;
	switch (index) {
		case 0:
			x = randomFloatFromInterval(Math.PI/4 - (this.generations.length - 1), Math.PI/4 + (this.generations.length - 1));
			z = randomFloatFromInterval(Math.PI/4 - (this.generations.length - 1), Math.PI/4 + (this.generations.length - 1));
			break;
		case 1:
			x = randomFloatFromInterval(-Math.PI/4 - (this.generations.length - 1), -Math.PI/4 + (this.generations.length - 1));
			z = randomFloatFromInterval(-Math.PI/4 - (this.generations.length - 1), -Math.PI/4 + (this.generations.length - 1));
			break;
		case 2:
			x = randomFloatFromInterval(-Math.PI/2 - (this.generations.length - 1), Math.PI/2 + (this.generations.length - 1));
			z = randomFloatFromInterval(-Math.PI/2 - (this.generations.length - 1), Math.PI/2 + (this.generations.length - 1));
			break;		

	}
	return {x : x, z : z};
};

Tree.prototype.getBranchColour = function () {
	var r = Math.min(128, 128 - this.generations.length * 8) ;
	var g = Math.min(255, 64 + this.generations.length * 16);
	var b = 0;

	return "rgb(" + r + "," + g + "," + b + ")";
}

Tree.prototype.splitBranches = function () {
	if (this.generations.length == MAX_GENS) {
		return;
	}
	var currGenBranches = this.generations[this.generations.length - 1];
	var nextGenBranches = [];
	var numGens = this.generations.length;
	var self = this;

	currGenBranches.forEach(function (branch) {
		if (branch.dying) {
			if (branch.lifespan > 0) {
				branch.lifespan--;
				nextGenBranches.push(branch);
			}
			return;
		}
		// branch continues growing
		// if (Math.random() > 0.5) {
			nextGenBranches.push(new Branch(
				branch.mesh, 
				2, 
				branch.topWidth, 
				branch.growthSpeed, 
				self.getBranchColour(),
				true,
				Math.floor(Math.random() * 60) + 60
			));
			nextGenBranches[nextGenBranches.length - 1].mesh.position.y = branch.getHeight();
			// nextGenBranches[nextGenBranches.length - 1].mesh.rotation.z = Math.random() * 0.5;
			// nextGenBranches[nextGenBranches.length - 1].mesh.rotation.x = Math.random() * 0.5;
		// }

		var numChildren = randomIntFromInterval(2, 3);
		for (var i = 0; i < numChildren; i++) {
			nextGenBranches.push(new Branch(
				branch.mesh, 
				branch.topWidth - GEN_WIDTH_DIFFS[numGens], 
				branch.topWidth, 
				self.getRandomGrowthSpeed(), 
				self.getBranchColour(),
				false,
				0
			));
			nextGenBranches[nextGenBranches.length - 1].mesh.position.y = branch.getHeight();
			var dir = self.getRandomDirection(i);
			nextGenBranches[nextGenBranches.length - 1].mesh.rotation.z = dir.z;
			nextGenBranches[nextGenBranches.length - 1].mesh.rotation.x = dir.x;
		}
	});
	this.generations.push(nextGenBranches);
};

function randomFloatFromInterval (min, max) {
    return Math.random()*(max-min)+min;
}

function randomIntFromInterval (min, max) {
    return Math.floor(Math.random()*(max-min+1)+min);
}
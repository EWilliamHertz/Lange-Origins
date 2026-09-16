function test() {
    let dx = 100;
    let dy = 100;
    let mDist = Math.sqrt(dx*dx + dy*dy) || 1;
    let steps = Math.floor(mDist);
    let count = 0;
    for (let i = 0; i < steps; i+=4) {
        count++;
        if (count > 1000) break;
    }
    console.log(count);
}
test();

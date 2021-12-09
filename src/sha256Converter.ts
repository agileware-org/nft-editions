const crypto = require("crypto");

// Generates the sha256 hash from a buffer/string and returns the hash hex-encoded
// @param buffer
export function sha256FromBuf(buffer:Buffer): string {
	let bitArray = buffer.toString('hex');
	let hashHex = crypto.createHash("sha256").update(bitArray).digest('hex');
	return "0x".concat(hashHex.toString());
}

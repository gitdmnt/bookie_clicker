pub fn hex2byte(hex: &str) -> Vec<u8> {
    let mut bytes = vec![];
    let mut hex = hex.to_owned();
    if hex.len() % 2 == 1 {
        hex += "0";
    }
    for i in (0..hex.len()).step_by(2) {
        let c = &hex[i..i + 2];
        let n = u8::from_str_radix(c, 16).unwrap();
        bytes.push(n);
    }
    bytes
}

pub fn byte2bool(bytes: &Vec<u8>) -> Vec<bool> {
    let mut bools = vec![];
    for n in bytes.into_iter() {
        for i in (0..8).rev() {
            bools.push(n & 2_u8.pow(i) == 2_u8.pow(i));
        }
    }
    bools
}

pub fn bool2byte(bools: &Vec<bool>) -> Vec<u8> {
    let mut byte = vec![];
    let mut bit: u8 = 0b0;
    for i in 0..bools.len() {
        bit <<= 1;
        bit += if bools[i] { 1 } else { 0 };
        if i % 8 == 7 {
            byte.push(bit);
            bit = 0b0;
        }
    }
    byte
}

pub fn byte2hex(bytes: &Vec<u8>) -> String {
    let mut hex = String::new();
    for byte in bytes {
        hex += &format!("{:02x}", byte);
    }
    hex
}

pub fn hex2bool(hex: &str) -> Vec<bool> {
    byte2bool(&hex2byte(&hex))
}

pub fn bool2hex(bools: &Vec<bool>) -> String {
    byte2hex(&bool2byte(&bools))
}

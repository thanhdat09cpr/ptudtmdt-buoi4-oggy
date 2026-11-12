
var name = "Nguyễn Thành Đạt";
var MSSV = 31241026984;
var hero = "Mèo Oggy";

document.write("Tôi tên là " + name +
    " - MSSV: " + MSSV +
    " sẽ quyết tâm trở thành siêu anh hùng " + hero);

var level = 1;
var xp = 0;
var skillPoints = 5;

level++;
xp = 150 * (level - 1) + 200;
skillPoints = skillPoints + xp / 10;

document.write("</br>" + name +
    " sẽ hóa thân thành " + hero +
    "</br>Cấp độ hiện tại của bạn là " + level);
var strength = 0.6 * skillPoints + 0.1 * xp;
var agility = 0.2 * skillPoints + 0.2 * xp;
var intel = 0.6 * skillPoints + 10 * level;

document.write("<br>LEVEL UP! Chúc mừng " + hero + " lên cấp 3! XP +200");

level = 3;
xp = xp + 300;

var nhapTen = prompt("Hãy nhập tên bạn");

if (nhapTen == name) {
    console.log("Chính xác! Bạn có trí nhớ rất tốt");
    intel = intel + 5;
} else {
    console.log("Tệ thật! Tên chính mình mà không nhớ");
    intel = intel - 5;
}

var chonVai = prompt("Oggy muốn chọn phân cấp nào? (a/b/c)\n" +
    "a - Oggy Cơ Bắp\nb - Oggy Ninja\nc - Oggy Thợ Săn Gián");
var phancap = "";

switch (chonVai) {
    case "a":
        phancap = "Oggy Cơ Bắp";
        strength = strength + 15;
        agility = agility - 10;
        intel = intel - 5;
        break;

    case "b":
        phancap = "Oggy Ninja";
        strength = strength - 15;
        agility = agility + 10;
        intel = intel + 5;
        break;

    case "c":
        phancap = "Oggy Thợ Săn Gián";
        strength = strength - 15;
        intel = intel + 15;
        break;
}

document.write("<br>Phân cấp của bạn: " + phancap);
document.write("<br>LEVEL UP! Chúc mừng " + hero + " lên cấp 4! XP +700");

level = 4;
xp = xp + 700;

// QUEST 5: ĐẠI CHIẾN BA CON GIÁN

// Xem xét các thông tin của đối thủ

level = 5; // Đảm bảo bạn sẽ ở cấp độ 5

var health = level + 100; // Khi lượng máu <= 0 thì bạn thua

console.log(strength); // Quyết định mức sát thương
console.log(agility);  // Quyết định xác suất né đòn
console.log(intel);    // Quyết định xác suất chí mạng

/*
==================================================
Bộ Ba Gián (Joey, Dee Dee, Marky)
--------------------------------------------------
Nhỏ con nhưng lắm mưu nhiều kế, chuyên phá nhà Oggy,
một cú bẫy của chúng có thể gây sát thương rất cao
==================================================
*/

var gianHealth = 600;
var gianStr = 100;
var gianAgi = 15;
var gianInt = 80;

var gameContinue = true;

while (gameContinue) {
    // Oggy tấn công!
    var heroHit = Math.random() * 100 > gianAgi;

    if (heroHit) {
        gianHealth = gianHealth - strength;
        alert('VỈ ĐẬP RUỒI! Oggy gây sát thương ' + strength + ' điểm cho Bộ Ba Gián!');

        var heroCritical = Math.random() * 100 < intel;

        if (heroCritical) {
            gianHealth = gianHealth - strength * 2; // Double damage
            alert('CHÍ MẠNG! Oggy gây sát thương chí mạng thêm ' + strength * 2 + ' điểm cho Bộ Ba Gián!');
        }
    } else {
        alert('XÍ HỤT! Bọn gián đã chui tọt vào lỗ tường!');
    }

    // Bộ Ba Gián tấn công!
    var gianHit = Math.random() * 100 > agility;

    if (gianHealth <= 0) {
        // Bộ Ba Gián bị tống ra khỏi nhà
        gameContinue = false;
        alert('CHIẾN THẮNG!!! Oggy đã tống cổ Bộ Ba Gián ra khỏi nhà!!!');
    } else {
        if (gianHit) {
            health = health - gianStr;
            alert('BẪY CHUỘT! Bộ Ba Gián gây sát thương ' + gianStr + ' điểm cho Oggy!');

            var gianCritical = Math.random() * 100 < gianInt;

            if (gianCritical) {
                health = health - gianStr * 2; // Double damage
                alert('CHÍ MẠNG! Bộ Ba Gián gây sát thương chí mạng thêm ' + gianStr * 2 + ' điểm cho Oggy!');
            }
        } else {
            alert('XÍ HỤT! Oggy đã né được cú bẫy của Bộ Ba Gián!');
        }
    }

    // Kiểm tra xem Oggy có bị hạ gục?!
    if (health <= 0) {
        gameContinue = false;
        alert('THẤT BẠI!!! Oggy đã bị Bộ Ba Gián đá văng ra khỏi nhà, Jack lại phải tới cứu rồi!');
    }
}

function _0x171e(_0x54b744, _0x421142) {
    const _0x324e31 = _0x324e();
    return _0x171e = function(_0x171e59, _0x3b0627) {
        _0x171e59 = _0x171e59 - 0x1ec;
        let _0x80224a = _0x324e31[_0x171e59];
        return _0x80224a;
    }, _0x171e(_0x54b744, _0x421142);
}

function _0x324e() {
    const _0x597aa3 = ['SUITE_ID', 'cookie', '1215381ipHOkj', '796212kWBBeL', '2636944YVjuWQ', 'Tracked\x20game', 'title', '9egJEBY', 'includes', 'POST', '12710LvkrLH', 'log', 'ajax', '1668jiugxr', 'split', './gamelist.json', '13069VCuZTv', '172604wXHQBU', '2607HMZsDB', '127139iaqXWR', '20SwxmyA', 'substring', 'games/', 'indexOf', 'length', 'location'];
    _0x324e = function() {
        return _0x597aa3;
    };
    return _0x324e();
}
const _0xa3d536 = _0x171e;
(function(_0x280fa0, _0x58da18) {
    const _0x47c625 = _0x171e,
        _0x31492d = _0x280fa0();
    while (!![]) {
        try {
            const _0x23c74a = parseInt(_0x47c625(0x202)) / 0x1 + parseInt(_0x47c625(0x1f2)) / 0x2 + parseInt(_0x47c625(0x1f1)) / 0x3 + parseInt(_0x47c625(0x200)) / 0x4 * (-parseInt(_0x47c625(0x203)) / 0x5) + parseInt(_0x47c625(0x1fc)) / 0x6 * (-parseInt(_0x47c625(0x1ff)) / 0x7) + -parseInt(_0x47c625(0x1f3)) / 0x8 * (-parseInt(_0x47c625(0x1f6)) / 0x9) + parseInt(_0x47c625(0x1f9)) / 0xa * (-parseInt(_0x47c625(0x201)) / 0xb);
            if (_0x23c74a === _0x58da18) break;
            else _0x31492d['push'](_0x31492d['shift']());
        } catch (_0x5b7f1a) {
            _0x31492d['push'](_0x31492d['shift']());
        }
    }
}(_0x324e, 0x4137d));
let gamelist;
getJSON(_0xa3d536(0x1fe), (_0x2538d8, _0x1d698b) => {
    if (_0x2538d8 != null) return ![];
    else gamelist = _0x1d698b;
});

function getCookie(_0x9d6707) {
    const _0x1710f5 = _0xa3d536;
    let _0x58d2d2 = _0x9d6707 + '=',
        _0x312bc3 = document[_0x1710f5(0x1f0)]['split'](';');
    for (let _0x564ebc = 0x0; _0x564ebc < _0x312bc3['length']; _0x564ebc++) {
        let _0x2f6e02 = _0x312bc3[_0x564ebc];
        while (_0x2f6e02['charAt'](0x0) == '\x20') {
            _0x2f6e02 = _0x2f6e02[_0x1710f5(0x204)](0x1);
        }
        if (_0x2f6e02[_0x1710f5(0x1ec)](_0x58d2d2) == 0x0) return _0x2f6e02['substring'](_0x58d2d2[_0x1710f5(0x1ed)], _0x2f6e02[_0x1710f5(0x1ed)]);
    }
    return '';
}
var id;

function checkAuth() {
    const _0x52ef05 = _0xa3d536;
    if (getCookie('SUITE_TOKEN') && getCookie(_0x52ef05(0x1ef))) return id = getCookie(_0x52ef05(0x1ef)), !![];
}

function track(_0x54c6b4) {
    const _0x5ccb68 = _0xa3d536;
    if (!checkAuth()) return ![];
    var _0x1b9c6f = _0x54c6b4[_0x5ccb68(0x1fd)](_0x5ccb68(0x205))[0x1];
    _0x1b9c6f = _0x1b9c6f[_0x5ccb68(0x1fd)]('/')[0x0], _0x1b9c6f = '/' + _0x1b9c6f + '/';
    var _0x305393 = gamelist['filter'](function(_0x3ca4ac) {
        const _0x4001c5 = _0x5ccb68;
        return _0x3ca4ac[_0x4001c5(0x1ee)][_0x4001c5(0x1f7)](_0x1b9c6f);
    });
    console[_0x5ccb68(0x1fa)](_0x305393[0x0][_0x5ccb68(0x1f5)]), logHistory(_0x305393[0x0][_0x5ccb68(0x1f5)]);
}

function logHistory(_0x4b9a8d) {
    const _0x5620e2 = _0xa3d536;
    $[_0x5620e2(0x1fb)]({
        'type': _0x5620e2(0x1f8),
        'url': 'https://vps14714.oxide.systems/ss-server/history/api/game-history',
        'data': {
            'id': id,
            'game': _0x4b9a8d
        },
        'success': _0x3ac757 => {
            const _0x3633b5 = _0x5620e2;
            console[_0x3633b5(0x1fa)](_0x3633b5(0x1f4));
        },
        'error': _0x125bb5 => {
            const _0x5782ff = _0x5620e2;
            console[_0x5782ff(0x1fa)]('Failed\x20to\x20track\x20game');
        }
    });
}
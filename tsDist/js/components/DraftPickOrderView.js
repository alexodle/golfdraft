"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const cx = require("classnames");
const DraftStore_1 = require("../stores/DraftStore");
const React = require("react");
const UserStore_1 = require("../stores/UserStore");
class DraftPickOrderView extends React.Component {
    constructor() {
        super(...arguments);
        this._onSelect = (pid) => {
            this.props.onUserSelected(pid);
        };
    }
    render() {
        const { pickingForUsers, currentPick, currentUser, autoPickUsers } = this.props;
        const myUser = currentUser._id;
        let pickOrder = DraftStore_1.default.getPickOrder();
        pickOrder = _.take(DraftStore_1.default.getPickOrder(), pickOrder.length / 4);
        return (React.createElement("div", null,
            React.createElement("p", null,
                React.createElement("small", null,
                    React.createElement("b", null, "Tip:"),
                    " your are picking for all users in bold")),
            React.createElement("p", null,
                React.createElement("small", null,
                    React.createElement("b", null, "Pro Tip:"),
                    " click on a user to see their picks")),
            React.createElement("ol", { className: 'pick-order-list' }, _.map(pickOrder, (pick, i) => {
                return (React.createElement("li", { key: pick.user, className: cx({
                        'my-user': (myUser === pick.user ||
                            _.includes(pickingForUsers, pick.user)),
                        'current-user': currentPick.user === pick.user
                    }) },
                    !autoPickUsers[pick.user] ? null : (React.createElement("span", null,
                        React.createElement("span", { className: 'label label-success auto-label' }, "AUTO"),
                        " ")),
                    React.createElement("a", { href: '#DraftHistory', onClick: _.partial(this._onSelect, pick.user) }, UserStore_1.default.getUser(pick.user).name)));
            }))));
    }
}
exports.default = DraftPickOrderView;
;

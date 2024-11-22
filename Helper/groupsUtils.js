const removeDeletedCommentsFromGroupsMsg = (groups) => {
  if (Array.isArray(groups)) {
    return groups.map((group) => {
      if (Array.isArray(group.messages)) {
        group.messages = group.messages
          .filter((msg) => msg.estado !== 0)
          .map((msg) => {
            if (Array.isArray(msg.comments)) {
              msg.comments = msg.comments.filter((comment) => comment.estado !== 0);
            }
            return msg;
          });
      }
      return group;
    });
  } else {
    if (Array.isArray(groups.messages)) {
      groups.messages = groups.messages
        .filter((msg) => msg.estado !== 0)
        .map((msg) => {
          if (Array.isArray(msg.comments)) {
            msg.comments = msg.comments.filter((comment) => comment.estado !== 0);
          }
          return msg;
        });
    }
    return groups;
  }
};

module.exports = {
  removeDeletedCommentsFromGroupsMsg
};

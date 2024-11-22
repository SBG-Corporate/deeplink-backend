const removeDeletedCommentsFromMsg = (messages) => {
  if (Array.isArray(messages)) {
    return messages.map((msg) => {
      if (Array.isArray(msg.comments)) {
        msg.comments = msg.comments.filter((comment) => {
          if (Array.isArray(comment.subComments)) {
            comment.subComments = comment.subComments.filter((subComment) => subComment.estado !== 0);
          }
          return comment.estado !== 0;
        });
      }
      return msg;
    });
  } else {
    if (Array.isArray(messages.comments)) {
      messages.comments = messages.comments.filter((comment) => {
        if (Array.isArray(comment.subComments)) {
          comment.subComments = comment.subComments.filter((subComment) => subComment.estado !== 0);
        }
        return comment.estado !== 0;
      });
    }
    return messages;
  }
};


module.exports = {
  removeDeletedCommentsFromMsg
};

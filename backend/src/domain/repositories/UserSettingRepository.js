class UserSettingRepository {
  async findByUser(userId) {
    throw new Error('findByUser not implemented');
  }

  async save(userSetting) {
    throw new Error('save not implemented');
  }

  async delete(userId) {
    throw new Error('delete not implemented');
  }
}

module.exports = UserSettingRepository;

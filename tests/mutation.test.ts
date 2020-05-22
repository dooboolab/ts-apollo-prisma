import { GraphQLClient, request } from 'graphql-request';

import { testHost } from './testSetup';

let client: GraphQLClient;

const signUpMutation = /* GraphQL */`
  mutation signUp($user: UserCreateInput) {
    signUp(user: $user) {
      token,
      user {
        email
      }
    }
  }
`;

const signInMutation = /* GraphQL */`
  mutation signIn($email: String! $password: String!) {
    signIn(email: $email password: $password) {
      token
      user {
        email
      }
    }
  }
`;

const updateProfileMutation = /* GraphQL */`
  mutation updateProfile($user: UserUpdateInput) {
    updateProfile(user: $user) {
      name
    }
  }
`;

const createDraftMutation = /* GraphQL */`
  mutation createDraft($title: String! $content: String!) {
    createDraft(title: $title content: $content) {
      id
      title
    }
  }
`;

const publishMutation = /* GraphQL */`
  mutation publish($id: Int!) {
    publish(id: $id) {
      id
      title
    }
  }
`;

const deletePostMutation = /* GraphQL */`
  mutation deletePost($id: Int!) {
    deletePost(id: $id) {
      id
    }
  }
`;

describe('Resolver - User', () => {
  it('should signUp user', async () => {
    const variables = {
      user: {
        name: 'dooboo1',
        email: 'dooboo@dooboolab.com',
        password: 'password',
      },
    };

    const response = await request(testHost, signUpMutation, variables);

    expect(response).toHaveProperty('signUp');
    expect(response.signUp).toHaveProperty('token');
    expect(response.signUp).toHaveProperty('user');
    expect(response.signUp.user.email).toEqual(variables.user.email);
  });

  it('should throw error when user does not exists', async () => {
    const variables = {
      email: 'testtest@test.com',
      password: 'password',
    };

    const promise = request(testHost, signInMutation, variables);
    expect(promise).rejects.toThrow();
  });

  it('should throw error when password is invalid', () => {
    const variables = {
      email: 'dooboo@dooboolab.com',
      password: 'invalid',
    };

    const promise = request(testHost, signInMutation, variables);
    expect(promise).rejects.toThrow();
  });

  it('should signIn user', async () => {
    const variables = {
      email: 'dooboo@dooboolab.com',
      password: 'password',
    };

    const response = await request(testHost, signInMutation, variables);
    expect(response).toHaveProperty('signIn');
    expect(response.signIn).toHaveProperty('token');
    expect(response.signIn).toHaveProperty('user');
    expect(response.signIn.user.email).toEqual(variables.email);

    // hyochan => Setup auth client for next test case
    client = new GraphQLClient(testHost, {
      headers: {
        authorization: response.signIn.token,
      },
    });
  });

  describe('Resolver - after signIn', () => {
    it('should update user profile', async () => {
      const variables = {
        user: {
          name: 'HelloBro',
        },
      };

      const response = await client.request(updateProfileMutation, variables);
      expect(response).toHaveProperty('updateProfile');
      expect(response.updateProfile).toHaveProperty('name');
      expect(response.updateProfile.name).toEqual(variables.user.name);
    });

    it('should create auth user`s draft', async () => {
      const variables = {
        title: 'title',
        content: 'content',
      };

      const response = await client.request(createDraftMutation, variables);
      expect(response).toHaveProperty('createDraft');
      expect(response.createDraft).toHaveProperty('id');
      expect(response.createDraft.title).toEqual('title');
    });

    it('should publish user`s draft', async () => {
      const variables = {
        id: 1,
      };

      const response = await client.request(publishMutation, variables);
      expect(response).toHaveProperty('publish');
      expect(response.publish).toHaveProperty('id');
      expect(response.publish.title).toEqual('title');
    });

    it('should delete user`s draft', async () => {
      const variables = {
        id: 1,
      };

      const response = await client.request(deletePostMutation, variables);
      expect(response).toHaveProperty('deletePost');
      expect(response.deletePost).toHaveProperty('id');
      expect(response.deletePost.id).toEqual(1);
    });
  });
});

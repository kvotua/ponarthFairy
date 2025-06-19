using UnityEngine;

public class PlayerWalking : MonoBehaviour
{
    // Start is called once before the first execution of Update after the MonoBehaviour is created
    [SerializeField] public static float _maxPlayerSpeed = 4f;
    [SerializeField] public static float _playerAccelaration = 0.1f;
    [SerializeField] private Joystick _joystick;
    private float _playerSpeed;
    private Vector3 _movementDirection;
    private Rigidbody _Rigidbody;
    void Start()
    {
        _Rigidbody = GetComponent<Rigidbody>();
    }

    // Update is called once per frame
    void Update()
    {
#if UNITY_ANDROID
            _movementDirection = new Vector3(_joystick.Vertical * -1, 0, _joystick.Horizontal);
#else

        _movementDirection = new Vector3(Input.GetAxis("Vertical") * -1, 0, Input.GetAxis("Horizontal"));
#endif
        _Rigidbody.transform.position += _movementDirection * _playerSpeed * Time.deltaTime;
        
    }

    private void FixedUpdate()
    {
        #if UNITY_ANDROID
            if(Input.touchCount > 0)
                _playerSpeed += _maxPlayerSpeed > _playerSpeed ? _playerAccelaration : 0;
            else _playerSpeed -= _playerSpeed > 0 ? _playerAccelaration : 0;
        #else
            if (Input.anyKey == true)
                 _playerSpeed += _maxPlayerSpeed > _playerSpeed ? _playerAccelaration : 0;
            else _playerSpeed -= _playerSpeed > 0 ? _playerAccelaration : 0;
        #endif
    }

}
